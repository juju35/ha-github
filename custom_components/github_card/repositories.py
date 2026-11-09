"""Repositories of the core GitHub integration: the ones it follows, the ones it offers, and changing them.

The GitHub integration keeps one config subentry per followed repository. The repositories it offers come
from its own "Add repository" flow (your repositories and your starred ones, read with its token), so this
integration needs no token of its own: it opens that flow, reads the choices, and aborts it.

Adding or removing a subentry reloads the GitHub entry (its update listener). Following 40 repositories
one by one would reload it 40 times, each reload refreshing every repository: ``async_apply`` unloads
the entry once, adds and removes the subentries, and sets it up again.
"""

from __future__ import annotations

import fnmatch
import logging
from collections.abc import Iterable
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import SOURCE_USER, ConfigEntry, ConfigEntryState, ConfigSubentry
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr

from .const import CONF_FILTER, CONF_INCLUDE_STARRED, CONF_REPOSITORY, DEFAULTS, GITHUB_DOMAIN, SUBENTRY_TYPE

_LOGGER = logging.getLogger(__name__)


def github_entry(hass: HomeAssistant) -> ConfigEntry | None:
    """The GitHub integration's entry (it allows a single one), if it is set up."""
    entries = hass.config_entries.async_entries(GITHUB_DOMAIN)
    return entries[0] if entries else None


def followed(entry: ConfigEntry) -> dict[str, str]:
    """Followed repositories: full name → subentry id."""
    return {
        sub.data[CONF_REPOSITORY]: sub.subentry_id
        for sub in entry.subentries.values()
        if sub.subentry_type == SUBENTRY_TYPE and sub.data.get(CONF_REPOSITORY)
    }


def login(hass: HomeAssistant, entry: ConfigEntry) -> str | None:
    """Login of the GitHub account: the name of the entry's device that is not a repository (owner/repo)."""
    for device in dr.async_entries_for_config_entry(dr.async_get(hass), entry.entry_id):
        if device.name and "/" not in device.name:
            return device.name
    return None


async def async_offered(hass: HomeAssistant, entry: ConfigEntry) -> list[str] | None:
    """Repositories the GitHub integration offers to add (not followed yet), or None if it cannot say.

    Opens its "Add repository" flow, reads the options of the repository field, and aborts the flow.
    """
    try:
        result = await hass.config_entries.subentries.async_init(
            (entry.entry_id, SUBENTRY_TYPE), context={"source": SOURCE_USER}
        )
    except Exception:  # noqa: BLE001 - an unknown handler, a flow that fails: no list, the panel says so
        _LOGGER.exception("Could not open the GitHub integration's repository flow")
        return None
    if result.get("type") is not FlowResultType.FORM:
        return None
    try:
        for key, selector in result["data_schema"].schema.items():
            if str(key) == CONF_REPOSITORY:
                options = getattr(selector, "config", {}).get("options", [])
                return [o["value"] if isinstance(o, dict) else str(o) for o in options]
        return None
    finally:
        hass.config_entries.subentries.async_abort(result["flow_id"])


def matches(name: str, patterns: str) -> bool:
    """Whether a full name matches one of the comma-separated patterns (any case); no pattern matches all."""
    globs = [p.strip().lower() for p in patterns.split(",") if p.strip()]
    return not globs or any(fnmatch.fnmatchcase(name.lower(), g) for g in globs)


@dataclass
class Overview:
    """What the panel's Repositories tab shows."""

    configured: bool
    state: str | None = None
    login: str | None = None
    followed: list[str] = field(default_factory=list)
    offered: list[str] = field(default_factory=list)
    # The integration could not list the repositories it offers (not loaded, API error)
    offered_error: bool = False

    def as_dict(self) -> dict[str, Any]:
        return {
            "configured": self.configured,
            "state": self.state,
            "login": self.login,
            "followed": self.followed,
            "offered": self.offered,
            "offered_error": self.offered_error,
        }


async def async_overview(hass: HomeAssistant, options: dict[str, Any]) -> Overview:
    """Followed repositories, and the ones offered that pass the settings (own only, unless starred are included;
    name patterns). The followed ones are always listed, whatever the settings."""
    entry = github_entry(hass)
    if entry is None:
        return Overview(configured=False)
    settings = {**DEFAULTS, **options}
    owner = login(hass, entry)
    offered = await async_offered(hass, entry) if entry.state is ConfigEntryState.LOADED else None
    names = []
    for name in offered or []:
        if not settings[CONF_INCLUDE_STARRED] and owner and name.split("/")[0].lower() != owner.lower():
            continue
        if matches(name, settings[CONF_FILTER]):
            names.append(name)
    return Overview(
        configured=True,
        state=entry.state.value,
        login=owner,
        followed=sorted(followed(entry), key=str.casefold),
        offered=sorted(names, key=str.casefold),
        offered_error=offered is None,
    )


async def async_apply(hass: HomeAssistant, add: Iterable[str] = (), remove: Iterable[str] = ()) -> dict[str, list[str]]:
    """Follow the repositories of `add` the integration offers, stop following those of `remove`.

    One reload of the GitHub entry for the whole change. Returns what was done, and what was skipped:
    a name the integration does not offer (nor already follows), or one it does not follow.
    """
    entry = github_entry(hass)
    if entry is None:
        raise ValueError("github_not_configured")
    current = followed(entry)
    add = [n for n in dict.fromkeys(add) if n not in current]
    remove_ids = {n: current[n] for n in dict.fromkeys(remove) if n in current}
    skipped = [n for n in remove if n not in current]
    if add:
        offered = await async_offered(hass, entry)
        if offered is None:
            raise ValueError("offered_unavailable")
        allowed = {n.casefold(): n for n in offered}
        skipped += [n for n in add if n.casefold() not in allowed]
        add = [allowed[n.casefold()] for n in add if n.casefold() in allowed]
    if not add and not remove_ids:
        return {"added": [], "removed": [], "skipped": skipped}

    loaded = entry.state is ConfigEntryState.LOADED
    if loaded:
        await hass.config_entries.async_unload(entry.entry_id)
    try:
        for name in add:
            hass.config_entries.async_add_subentry(
                entry,
                ConfigSubentry(
                    data=MappingProxyType({CONF_REPOSITORY: name}),
                    subentry_type=SUBENTRY_TYPE,
                    title=name,
                    unique_id=name,
                ),
            )
        for subentry_id in remove_ids.values():
            hass.config_entries.async_remove_subentry(entry, subentry_id)
    finally:
        if loaded:
            await hass.config_entries.async_setup(entry.entry_id)
    return {"added": add, "removed": list(remove_ids), "skipped": skipped}
