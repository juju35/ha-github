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

from .const import BADGE_URL, CARD_URL, DEFAULTS, DOMAIN, I18N_URL, LEGACY_CARD_PATH, PANEL_PATH, PANEL_URL, VERSION
from .items import ItemsPoller
from .notify import NewItemNotifier
from .panel import async_register_panel

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
# Set once the card is loaded, cleared when the entry is removed
CARD_LOADED = f"{DOMAIN}_card_loaded"
# Set once the sidebar badge module is loaded on every page
BADGE_LOADED = f"{DOMAIN}_badge_loaded"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the card and the panel files, and their translations."""
    base = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(CARD_URL, str(base / "github-card.js"), True),
            StaticPathConfig(PANEL_URL, str(base / "github-panel.js"), True),
            StaticPathConfig(BADGE_URL, str(base / "github-badge.js"), True),
            # One file per language, fetched with ?v=<version> so that an update is never served from the cache
            StaticPathConfig(I18N_URL, str(base / "i18n"), True),
        ]
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Add the sidebar panel, load the card on every dashboard, and watch for new issues / pull requests."""
    await async_register_panel(hass)

    # The sidebar badge module, loaded on every page (once), so the open issues / pull requests count shows on the
    # GitHub panel item even with the panel closed.
    if not hass.data.get(BADGE_LOADED):
        hass.data[BADGE_LOADED] = True
        add_extra_js_url(hass, f"{BADGE_URL}?v={VERSION}")

    async def _register(_: Event | None = None) -> None:
        if not hass.data.get(CARD_LOADED):
            await _async_load_card(hass)

    if hass.state is CoreState.running:
        await _register()
    else:
        entry.async_on_unload(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register))

    notifier = NewItemNotifier(hass, lambda: {**DEFAULTS, **entry.options})
    entry.async_on_unload(notifier.async_start())

    # Fetch the open issues and pull requests in the background, on the configured interval, so the panel reads
    # them from the cache instead of querying GitHub each time a tab opens.
    poller = ItemsPoller(hass, lambda: {**DEFAULTS, **entry.options})
    hass.data.setdefault(DOMAIN, {})["poller"] = poller
    entry.async_on_unload(poller.async_start())

    def _forget_poller() -> None:
        hass.data.get(DOMAIN, {}).pop("poller", None)

    entry.async_on_unload(_forget_poller)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Re-arm the background poller when the refresh interval changes."""
    if poller := hass.data.get(DOMAIN, {}).get("poller"):
        poller.async_reschedule()


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
