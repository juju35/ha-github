"""The ``github_card.create_repository`` action: the panel's New repository tab, for scripts and automations.

Administrators only (``async_register_admin_service``: a non-admin user gets *Unauthorized*). It creates the
repository with the GitHub CLI exactly as the tab does (``gh_cli.async_create``); the fields left out take the
defaults of Settings → New repositories (visibility, website template with ``{name}`` / ``{owner}``, topics, every
protection). The response gives the repository and the steps; a creation that fails raises an error.
"""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.service import async_register_admin_service

from .const import (
    CONF_REPO_HOMEPAGE,
    CONF_REPO_RULESETS_FROM,
    CONF_REPO_TOPICS,
    CONF_REPO_VISIBILITY,
    DOMAIN,
    REPO_PROTECTIONS,
)
from .gh_cli import MAX_DESCRIPTION, MAX_HOMEPAGE, MAX_TOPICS, VISIBILITIES, async_create, async_status
from .panel import _PROTECT, _entry, settings

SERVICE_CREATE_REPOSITORY = "create_repository"

_SPLIT_RE = re.compile(r"[,\s]+")


def _topics(value: Any) -> list[str]:
    """Topics as a list, or as one text separated by commas or spaces (as in the tab)."""
    items = value if isinstance(value, list) else [value]
    return [t for item in items for t in _SPLIT_RE.split(str(item)) if t]


CREATE_REPOSITORY_SCHEMA = vol.Schema(
    {
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=100)),
        vol.Optional("owner", default=""): vol.All(str, vol.Length(max=39)),
        vol.Optional("description", default=""): vol.All(str, vol.Length(max=MAX_DESCRIPTION)),
        vol.Optional("homepage"): vol.All(str, vol.Length(max=MAX_HOMEPAGE)),
        vol.Optional("topics"): vol.All(_topics, vol.Length(max=MAX_TOPICS)),
        vol.Optional("visibility"): vol.In(VISIBILITIES),
        # The protections of this repository; missing ones: the defaults of Settings
        vol.Optional("protect", default=dict): _PROTECT,
    }
)


async def _async_create_repository(hass: HomeAssistant, call: ServiceCall) -> ServiceResponse:
    data = call.data
    current = settings(_entry(hass))
    name, owner = data["name"].strip(), data["owner"].strip()
    if "homepage" in data:
        homepage = data["homepage"]
    else:
        # The website template of Settings, as the tab fills it in
        login = owner or (await async_status(hass)).get("login") or ""
        homepage = current[CONF_REPO_HOMEPAGE].replace("{name}", name).replace("{owner}", login)
    topics = data["topics"] if "topics" in data else _topics(current[CONF_REPO_TOPICS])
    result = await async_create(
        hass,
        name=name,
        owner=owner,
        description=data["description"],
        homepage=homepage,
        topics=topics,
        visibility=data.get("visibility", current[CONF_REPO_VISIBILITY]),
        protect={key: current[key] for key in (*REPO_PROTECTIONS, CONF_REPO_RULESETS_FROM)} | data["protect"],
    )
    if not result["ok"]:
        error = result["error"] + (f": {result['message']}" if result.get("message") else "")
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="create_repository_failed",
            translation_placeholders={"name": name, "error": error},
        )
    return {key: result[key] for key in ("full_name", "url", "topics", "steps")}


def async_register_services(hass: HomeAssistant) -> None:
    """Register the actions (once, when the integration is set up)."""

    async def _handler(call: ServiceCall) -> ServiceResponse:
        return await _async_create_repository(hass, call)

    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICE_CREATE_REPOSITORY,
        _handler,
        schema=CREATE_REPOSITORY_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
