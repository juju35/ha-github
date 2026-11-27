"""Sidebar panel (administrators only) and its WebSocket commands.

The panel (``frontend/github-panel.js``) has four tabs: Repositories (follow / stop following the
repositories of your GitHub account in the GitHub integration, their counters and the GitHub Card's details),
Issues and Pull requests (open ones of the followed repositories) and Settings. Commands:

- ``github_card/repositories``: the GitHub integration's state, the followed repositories and the ones
  it offers that pass the settings;
- ``github_card/follow``: follows and unfollows repositories, with a single reload of the GitHub entry;
- ``github_card/items``: the open issues and pull requests of the followed repositories (GitHub GraphQL API,
  with the GitHub integration's token, cached for 5 minutes; ``refresh`` asks GitHub again);
- ``github_card/mine``: the open pull requests authored by the token's user, in any repository (GitHub search,
  cached for 5 minutes; ``refresh`` asks GitHub again);
- ``github_card/gh_status``: whether the GitHub CLI (``gh``) is installed on the Home Assistant host and signed in
  (the panel's Create tab shows only then; ``refresh`` asks gh again);
- ``github_card/create_repo``: creates a repository with gh (name, optional owner, description, homepage,
  topics, visibility, protections — the defaults of Settings unless given);
- ``github_card/settings`` / ``github_card/update_settings``: the settings (options of the entry), among them
  ``hide_toolbar`` (the panel's top bar hidden for nobody, everyone or non-administrators, the tabs kept), also given
  in the panel's registration.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send

from .const import (
    CONF_FILTER,
    CONF_HIDE_TOOLBAR,
    CONF_IGNORE_ARCHIVED,
    CONF_INCLUDE_STARRED,
    CONF_NOTIFY_ISSUES,
    CONF_NOTIFY_PULLS,
    CONF_NOTIFY_RELEASES,
    CONF_REFRESH_MINUTES,
    CONF_REPO_HOMEPAGE,
    CONF_REPO_RULESETS_FROM,
    CONF_REPO_TOPICS,
    CONF_REPO_VISIBILITY,
    DEFAULTS,
    DOMAIN,
    HIDE_TOOLBAR_CHOICES,
    HIDE_TOOLBAR_OFF,
    MAX_FILTER_LENGTH,
    MAX_REFRESH_MINUTES,
    MIN_REFRESH_MINUTES,
    PANEL_PATH,
    PANEL_URL,
    REPO_PROTECTIONS,
    SIGNAL_ITEMS_UPDATED,
    VERSION,
)
from .gh_cli import MAX_DESCRIPTION, MAX_HOMEPAGE, MAX_TOPICS, VISIBILITIES, async_create, async_status
from .items import async_items, async_mine, current_items
from .repositories import async_apply, async_overview

MAX_REPOSITORIES = 500


async def _async_register_sidebar(hass: HomeAssistant) -> None:
    # hide_toolbar here too: the panel knows it as soon as it is created, before its settings arrive (no title bar
    # shown then hidden while the page loads)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="github-panel",
        sidebar_title="GitHub",
        sidebar_icon="mdi:github",
        module_url=f"{PANEL_URL}?v={VERSION}",
        require_admin=True,
        config={"version": VERSION, CONF_HIDE_TOOLBAR: settings(_entry(hass))[CONF_HIDE_TOOLBAR]},
    )


async def async_register_panel(hass: HomeAssistant) -> None:
    """Add GitHub to the sidebar (administrators only) and the panel's commands."""
    await _async_register_sidebar(hass)
    for command in (
        _ws_repositories,
        _ws_follow,
        _ws_items,
        _ws_subscribe_items,
        _ws_mine,
        _ws_gh_status,
        _ws_create_repo,
        _ws_settings,
        _ws_update_settings,
    ):
        websocket_api.async_register_command(hass, command)


def _entry(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def hide_toolbar(value: Any) -> str:
    """The top bar choice; a switch saved by an older version: on, hidden for everyone."""
    if isinstance(value, bool):
        return "all" if value else HIDE_TOOLBAR_OFF
    return value if value in HIDE_TOOLBAR_CHOICES else HIDE_TOOLBAR_OFF


def settings(entry: ConfigEntry | None) -> dict[str, Any]:
    """The settings, defaults filled in."""
    merged = {**DEFAULTS, **(entry.options if entry else {})}
    merged[CONF_HIDE_TOOLBAR] = hide_toolbar(merged[CONF_HIDE_TOOLBAR])
    return merged


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/repositories"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_repositories(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    overview = await async_overview(hass, settings(_entry(hass)))
    connection.send_result(msg["id"], overview.as_dict())


# owner/repo, or empty: the template repository whose rulesets a new repository gets
_RULESETS_FROM = vol.All(
    str, vol.Length(max=140), vol.Match(r"^$|^[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9_][A-Za-z0-9._-]*$")
)
_PROTECT = vol.Schema(
    {**{vol.Optional(key): bool for key in REPO_PROTECTIONS}, vol.Optional(CONF_REPO_RULESETS_FROM): _RULESETS_FROM}
)

_NAMES = vol.All(
    [vol.All(str, vol.Length(min=3, max=200), vol.Match(r"^[^/\s]+/[^/\s]+$"))], vol.Length(max=MAX_REPOSITORIES)
)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/follow",
        vol.Optional("add", default=list): _NAMES,
        vol.Optional("remove", default=list): _NAMES,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_follow(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    try:
        result = await async_apply(hass, add=msg["add"], remove=msg["remove"])
    except ValueError as err:
        connection.send_result(msg["id"], {"ok": False, "error": str(err)})
        return
    # The followed repositories changed: fetch their issues and pull requests now, out of the poller's cycle.
    if poller := hass.data.get(DOMAIN, {}).get("poller"):
        poller.async_refresh_soon()
    connection.send_result(msg["id"], {"ok": True, **result})


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/items", vol.Optional("refresh", default=False): bool}
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_items(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """The open issues and pull requests. ``refresh`` queries GitHub now (the panel's Refresh button); otherwise
    the cache the background poller fills is returned, without any GitHub query."""
    if msg["refresh"]:
        items = await async_items(hass, refresh=True)
        async_dispatcher_send(hass, SIGNAL_ITEMS_UPDATED)
    else:
        items = current_items(hass)
    connection.send_result(msg["id"], items.as_dict())


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe_items"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_subscribe_items(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Push the cached issues and pull requests to the panel: the current snapshot now, then after each poll."""

    @callback
    def _forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], current_items(hass).as_dict()))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_ITEMS_UPDATED, _forward)
    connection.send_result(msg["id"])
    _forward()


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/mine", vol.Optional("refresh", default=False): bool})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_mine(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """The open pull requests of the token's user, across every repository. Cached 5 minutes by the integration;
    ``refresh`` (the panel's Refresh button) asks GitHub again."""
    mine = await async_mine(hass, refresh=msg["refresh"])
    connection.send_result(msg["id"], mine.as_dict())


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/gh_status", vol.Optional("refresh", default=False): bool}
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_gh_status(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Whether gh is installed and signed in: the panel shows its Create tab only then."""
    connection.send_result(msg["id"], await async_status(hass, refresh=msg["refresh"]))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/create_repo",
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=100)),
        vol.Optional("owner", default=""): vol.All(str, vol.Length(max=39)),
        vol.Optional("description", default=""): vol.All(str, vol.Length(max=MAX_DESCRIPTION)),
        vol.Optional("homepage", default=""): vol.All(str, vol.Length(max=MAX_HOMEPAGE)),
        vol.Optional("topics", default=list): vol.All([vol.All(str, vol.Length(max=50))], vol.Length(max=MAX_TOPICS)),
        vol.Optional("visibility", default="public"): vol.In(VISIBILITIES),
        # The protections of this repository; missing ones: the defaults of Settings
        vol.Optional("protect", default=dict): _PROTECT,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_create_repo(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Create a repository with gh, then protect it: ``{"ok": True, "full_name", "url", "steps"}`` or
    ``{"ok": False, "error"}``."""
    current = settings(_entry(hass))
    protect = {key: current[key] for key in (*REPO_PROTECTIONS, CONF_REPO_RULESETS_FROM)} | msg["protect"]
    result = await async_create(
        hass,
        name=msg["name"],
        owner=msg["owner"],
        description=msg["description"],
        homepage=msg["homepage"],
        topics=msg["topics"],
        visibility=msg["visibility"],
        protect=protect,
    )
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/settings"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    connection.send_result(msg["id"], {"settings": settings(_entry(hass))})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_settings",
        vol.Optional(CONF_FILTER): vol.All(str, vol.Length(max=MAX_FILTER_LENGTH)),
        vol.Optional(CONF_INCLUDE_STARRED): bool,
        vol.Optional(CONF_IGNORE_ARCHIVED): bool,
        vol.Optional(CONF_NOTIFY_ISSUES): bool,
        vol.Optional(CONF_NOTIFY_PULLS): bool,
        vol.Optional(CONF_NOTIFY_RELEASES): bool,
        vol.Optional(CONF_HIDE_TOOLBAR): vol.All(vol.Any(bool, vol.In(HIDE_TOOLBAR_CHOICES)), hide_toolbar),
        vol.Optional(CONF_REFRESH_MINUTES): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_REFRESH_MINUTES, max=MAX_REFRESH_MINUTES)
        ),
        # Defaults of the New repository tab
        vol.Optional(CONF_REPO_VISIBILITY): vol.In(VISIBILITIES),
        vol.Optional(CONF_REPO_HOMEPAGE): vol.All(str, vol.Length(max=MAX_HOMEPAGE)),
        vol.Optional(CONF_REPO_TOPICS): vol.All(str, vol.Length(max=MAX_FILTER_LENGTH)),
        vol.Optional(CONF_REPO_RULESETS_FROM): _RULESETS_FROM,
        **{vol.Optional(key): bool for key in REPO_PROTECTIONS},
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_update_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    if (entry := _entry(hass)) is None:
        connection.send_result(msg["id"], {"ok": False, "error": "not_found"})
        return
    current = settings(entry)
    updated = {**current, **{key: msg[key] for key in DEFAULTS if key in msg}}
    updated[CONF_FILTER] = ", ".join(p.strip() for p in updated[CONF_FILTER].split(",") if p.strip())
    if updated != current:
        hass.config_entries.async_update_entry(entry, options=updated)
        if updated[CONF_HIDE_TOOLBAR] != current[CONF_HIDE_TOOLBAR]:
            # The title bar choice is in the panel's registration: registered again with it
            frontend.async_remove_panel(hass, PANEL_PATH)
            await _async_register_sidebar(hass)
    connection.send_result(msg["id"], {"ok": True, "settings": updated})
