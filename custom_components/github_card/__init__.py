"""GitHub Card: the Lovelace cards of the GitHub integration, and an admin sidebar panel to follow repositories."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from homeassistant.components import frontend
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import CARD_URL, DEFAULTS, DOMAIN, LEGACY_CARD_PATH, PANEL_PATH, PANEL_URL, VERSION
from .notify import NewItemNotifier
from .panel import async_register_panel

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
# Set once the card is loaded, cleared when the entry is removed
CARD_LOADED = f"{DOMAIN}_card_loaded"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the card and the panel files."""
    base = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(CARD_URL, str(base / "github-card.js"), True),
            StaticPathConfig(PANEL_URL, str(base / "github-panel.js"), True),
        ]
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Add the sidebar panel, load the card on every dashboard, and watch for new issues / pull requests."""
    await async_register_panel(hass)

    async def _register(_: Event | None = None) -> None:
        if not hass.data.get(CARD_LOADED):
            await _async_load_card(hass)

    if hass.state is CoreState.running:
        await _register()
    else:
        entry.async_on_unload(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register))

    notifier = NewItemNotifier(hass, lambda: {**DEFAULTS, **entry.options})
    entry.async_on_unload(notifier.async_start())
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the panel; the card stays loaded until the entry is removed."""
    frontend.async_remove_panel(hass, PANEL_PATH)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Drop the card's dashboard resource."""
    if (resources := _storage_resources(hass)) is None:
        return
    hass.data[CARD_LOADED] = False
    await resources.async_get_info()
    for item in list(resources.async_items()):
        if item.get("url", "").split("?")[0] == CARD_URL:
            await resources.async_delete_item(item["id"])


async def _async_load_card(hass: HomeAssistant) -> None:
    """Add the card to the dashboard resources, or load it on every page in YAML mode."""
    hass.data[CARD_LOADED] = True
    if not await _async_register_resource(hass):
        add_extra_js_url(hass, f"{CARD_URL}?v={VERSION}")


def _storage_resources(hass: HomeAssistant) -> Any | None:
    """The dashboard resources collection when it is editable from the UI.

    hass.data["lovelace"] is a dataclass whose `mode` field became `resource_mode` in Home Assistant 2026.2.
    """
    lovelace = hass.data.get("lovelace")
    if getattr(lovelace, "resource_mode", getattr(lovelace, "mode", None)) != "storage":
        return None
    return getattr(lovelace, "resources", None)


async def _async_register_resource(hass: HomeAssistant) -> bool:
    """Add or update the card in Settings → Dashboards → Resources, replacing the card installed before 2.0."""
    resources = _storage_resources(hass)
    if resources is None:
        return False
    url = f"{CARD_URL}?v={VERSION}"
    try:
        await resources.async_get_info()  # loads the collection from storage
        for item in list(resources.async_items()):
            if LEGACY_CARD_PATH in item.get("url", ""):
                await resources.async_delete_item(item["id"])
        existing = [item for item in resources.async_items() if item.get("url", "").split("?")[0] == CARD_URL]
        if not existing:
            await resources.async_create_item({"res_type": "module", "url": url})
            return True
        if existing[0]["url"] != url:
            await resources.async_update_item(existing[0]["id"], {"res_type": "module", "url": url})
        for duplicate in existing[1:]:
            await resources.async_delete_item(duplicate["id"])
    except Exception:  # noqa: BLE001 - never block the integration on the card
        _LOGGER.exception("Could not register the GitHub card as a dashboard resource")
        return False
    return True
