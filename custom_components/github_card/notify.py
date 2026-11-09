"""Persistent notification when a followed repository gets a new issue or pull request (off by default).

Follows the "Latest issue" and "Latest pull request" sensors of the GitHub integration: a higher number
than before is a new one. A sensor coming back from unavailable or unknown (a reload) says nothing new.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.const import EVENT_STATE_CHANGED, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import CONF_NOTIFY_ISSUES, CONF_NOTIFY_PULLS, DOMAIN, GITHUB_DOMAIN

KINDS = {"latest_issue": CONF_NOTIFY_ISSUES, "latest_pull_request": CONF_NOTIFY_PULLS}

# Notification titles: {repo} is the repository's full name
MESSAGES: dict[str, dict[str, str]] = {
    "en": {"latest_issue": "New issue in {repo}", "latest_pull_request": "New pull request in {repo}"},
    "fr": {"latest_issue": "Nouvelle issue dans {repo}", "latest_pull_request": "Nouvelle pull request dans {repo}"},
    "de": {"latest_issue": "Neues Issue in {repo}", "latest_pull_request": "Neuer Pull Request in {repo}"},
    "es": {"latest_issue": "Nueva issue en {repo}", "latest_pull_request": "Nueva pull request en {repo}"},
    "sr": {"latest_issue": "Нови проблем у {repo}", "latest_pull_request": "Нови pull захтев у {repo}"},
    "sr-Latn": {"latest_issue": "Novi problem u {repo}", "latest_pull_request": "Novi pull zahtev u {repo}"},
    "it": {"latest_issue": "Nuova issue in {repo}", "latest_pull_request": "Nuova pull request in {repo}"},
    "nl": {"latest_issue": "Nieuwe issue in {repo}", "latest_pull_request": "Nieuwe pull request in {repo}"},
    "pt": {"latest_issue": "Nova issue em {repo}", "latest_pull_request": "Novo pull request em {repo}"},
    "pl": {"latest_issue": "Nowe zgłoszenie w {repo}", "latest_pull_request": "Nowy pull request w {repo}"},
    "ro": {"latest_issue": "Issue nou în {repo}", "latest_pull_request": "Pull request nou în {repo}"},
    "da": {"latest_issue": "Ny issue i {repo}", "latest_pull_request": "Ny pull request i {repo}"},
    "sv": {"latest_issue": "Nytt ärende i {repo}", "latest_pull_request": "Ny pull request i {repo}"},
    "bg": {"latest_issue": "Нов проблем в {repo}", "latest_pull_request": "Нова pull заявка в {repo}"},
    "ru": {"latest_issue": "Новая задача в {repo}", "latest_pull_request": "Новый pull-запрос в {repo}"},
    "uk": {"latest_issue": "Нова задача в {repo}", "latest_pull_request": "Новий pull-запит у {repo}"},
    "hu": {"latest_issue": "Új hibajegy: {repo}", "latest_pull_request": "Új pull request: {repo}"},
    "sk": {"latest_issue": "Nový problém v {repo}", "latest_pull_request": "Nový pull request v {repo}"},
    "cs": {"latest_issue": "Nový problém v {repo}", "latest_pull_request": "Nový pull request v {repo}"},
    "sl": {"latest_issue": "Nova težava v {repo}", "latest_pull_request": "Nov pull request v {repo}"},
    "lv": {
        "latest_issue": "Jauna problēma krātuvē {repo}",
        "latest_pull_request": "Jauns pull pieprasījums krātuvē {repo}",
    },
    "el": {"latest_issue": "Νέο ζήτημα στο {repo}", "latest_pull_request": "Νέο pull request στο {repo}"},
}


def message_language(language: str | None) -> str:
    """Supported language of a Home Assistant code (``sr-Latn`` as is, ``de-CH`` → ``de``), English otherwise."""
    if language in MESSAGES:
        return language
    base = (language or "").split("-")[0].lower()
    return base if base in MESSAGES else "en"


def _number(state: Any) -> int | None:
    if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
        return None
    try:
        return int(state.attributes.get("number"))
    except (TypeError, ValueError):
        return None


class NewItemNotifier:
    """Watches the latest issue / pull request sensors of the GitHub integration."""

    def __init__(self, hass: HomeAssistant, options: Callable[[], dict[str, Any]]) -> None:
        self._hass = hass
        self._options = options
        self._watched: dict[str, str] | None = None  # entity id → kind, rebuilt when the registry changes

    @callback
    def async_start(self) -> Callable[[], None]:
        unsubs = [
            self._hass.bus.async_listen(EVENT_STATE_CHANGED, self._state_changed),
            self._hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, self._registry_changed),
        ]

        @callback
        def _stop() -> None:
            for unsub in unsubs:
                unsub()

        return _stop

    @callback
    def _registry_changed(self, _event: Event) -> None:
        self._watched = None

    def _watch_list(self) -> dict[str, str]:
        if self._watched is None:
            self._watched = {
                e.entity_id: e.translation_key
                for e in er.async_get(self._hass).entities.values()
                if e.platform == GITHUB_DOMAIN and e.translation_key in KINDS
            }
        return self._watched

    @callback
    def _state_changed(self, event: Event) -> None:
        entity_id = event.data["entity_id"]
        kind = self._watch_list().get(entity_id)
        if kind is None or not self._options().get(KINDS[kind]):
            return
        old, new = _number(event.data.get("old_state")), _number(event.data.get("new_state"))
        if old is None or new is None or new <= old:
            return
        state = event.data["new_state"]
        entry = er.async_get(self._hass).async_get(entity_id)
        device = dr.async_get(self._hass).async_get(entry.device_id) if entry and entry.device_id else None
        repo = device.name if device and device.name else entity_id
        lang = message_language(self._hass.config.language)
        title = MESSAGES[lang][kind].format(repo=repo)
        url = state.attributes.get("url")
        text = f"#{new} {state.state}"
        persistent_notification.async_create(
            self._hass,
            f"[{text}]({url})" if isinstance(url, str) and url.startswith("https://") else text,
            title=title,
            notification_id=f"{DOMAIN}_{kind}_{repo}",
        )
