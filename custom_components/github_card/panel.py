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
- ``github_card/settings`` / ``github_card/update_settings``: the settings (options of the entry).
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import panel_custom, websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send

from .const import (
    CONF_FILTER,
    CONF_IGNORE_ARCHIVED,
    CONF_INCLUDE_STARRED,
    CONF_NOTIFY_ISSUES,
    CONF_NOTIFY_PULLS,
    CONF_NOTIFY_RELEASES,
    CONF_REFRESH_MINUTES,
    DEFAULTS,
    DOMAIN,
    MAX_FILTER_LENGTH,
    MAX_REFRESH_MINUTES,
    MIN_REFRESH_MINUTES,
    PANEL_PATH,
    PANEL_URL,
    SIGNAL_ITEMS_UPDATED,
    VERSION,
)
from .items import async_items, async_mine, current_items
from .repositories import async_apply, async_overview

MAX_REPOSITORIES = 500


async def async_register_panel(hass: HomeAssistant) -> None:
    """Add GitHub to the sidebar (administrators only) and the panel's commands."""
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="github-panel",
        sidebar_title="GitHub",
        sidebar_icon="mdi:github",
        module_url=f"{PANEL_URL}?v={VERSION}",
        require_admin=True,
        config={"version": VERSION},
    )
    for command in (
        _ws_repositories,
        _ws_follow,
        _ws_items,
        _ws_subscribe_items,
        _ws_mine,
        _ws_settings,
        _ws_update_settings,
    ):
        websocket_api.async_register_command(hass, command)


def _entry(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def settings(entry: ConfigEntry | None) -> dict[str, Any]:
    """The settings, defaults filled in."""
    return {**DEFAULTS, **(entry.options if entry else {})}


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/repositories"})
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_repositories(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    overview = await async_overview(hass, settings(_entry(hass)))
    connection.send_result(msg["id"], overview.as_dict())


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
        vol.Optional(CONF_REFRESH_MINUTES): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_REFRESH_MINUTES, max=MAX_REFRESH_MINUTES)
        ),
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
    connection.send_result(msg["id"], {"ok": True, "settings": updated})
