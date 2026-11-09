"""Persistent notification when a followed repository gets a new issue, pull request or release (off by default).

Follows the "Latest issue", "Latest pull request" and "Latest release" sensors of the GitHub integration: a higher
number than before is a new issue or pull request, another tag a new release. A sensor coming back from unavailable
or unknown (a reload) says nothing new.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.const import EVENT_STATE_CHANGED, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import CONF_NOTIFY_ISSUES, CONF_NOTIFY_PULLS, CONF_NOTIFY_RELEASES, DOMAIN, GITHUB_DOMAIN

KINDS = {
    "latest_issue": CONF_NOTIFY_ISSUES,
    "latest_pull_request": CONF_NOTIFY_PULLS,
    "latest_release": CONF_NOTIFY_RELEASES,
}

# Notification titles: {repo} is the repository's full name
MESSAGES: dict[str, dict[str, str]] = {
    "en": {
        "latest_issue": "New issue in {repo}",
        "latest_pull_request": "New pull request in {repo}",
        "latest_release": "New release of {repo}",
    },
    "fr": {
        "latest_issue": "Nouvelle issue dans {repo}",
        "latest_pull_request": "Nouvelle pull request dans {repo}",
        "latest_release": "Nouvelle version de {repo}",
    },
    "de": {
        "latest_issue": "Neues Issue in {repo}",
        "latest_pull_request": "Neuer Pull Request in {repo}",
        "latest_release": "Neues Release von {repo}",
    },
    "es": {
        "latest_issue": "Nueva issue en {repo}",
        "latest_pull_request": "Nueva pull request en {repo}",
        "latest_release": "Nueva versión de {repo}",
    },
    "sr": {
        "latest_issue": "Нови проблем у {repo}",
        "latest_pull_request": "Нови pull захтев у {repo}",
        "latest_release": "Ново издање за {repo}",
    },
    "sr-Latn": {
        "latest_issue": "Novi problem u {repo}",
        "latest_pull_request": "Novi pull zahtev u {repo}",
        "latest_release": "Novo izdanje za {repo}",
    },
    "it": {
        "latest_issue": "Nuova issue in {repo}",
        "latest_pull_request": "Nuova pull request in {repo}",
        "latest_release": "Nuova release di {repo}",
    },
    "nl": {
        "latest_issue": "Nieuwe issue in {repo}",
        "latest_pull_request": "Nieuwe pull request in {repo}",
        "latest_release": "Nieuwe release van {repo}",
    },
    "pt": {
        "latest_issue": "Nova issue em {repo}",
        "latest_pull_request": "Novo pull request em {repo}",
        "latest_release": "Nova versão de {repo}",
    },
    "pl": {
        "latest_issue": "Nowe zgłoszenie w {repo}",
        "latest_pull_request": "Nowy pull request w {repo}",
        "latest_release": "Nowe wydanie {repo}",
    },
    "ro": {
        "latest_issue": "Issue nou în {repo}",
        "latest_pull_request": "Pull request nou în {repo}",
        "latest_release": "Versiune nouă pentru {repo}",
    },
    "da": {
        "latest_issue": "Ny issue i {repo}",
        "latest_pull_request": "Ny pull request i {repo}",
        "latest_release": "Ny udgivelse af {repo}",
    },
    "sv": {
        "latest_issue": "Nytt ärende i {repo}",
        "latest_pull_request": "Ny pull request i {repo}",
        "latest_release": "Ny version av {repo}",
    },
    "bg": {
        "latest_issue": "Нов проблем в {repo}",
        "latest_pull_request": "Нова pull заявка в {repo}",
        "latest_release": "Нова версия на {repo}",
    },
    "ru": {
        "latest_issue": "Новая задача в {repo}",
        "latest_pull_request": "Новый pull-запрос в {repo}",
        "latest_release": "Новый релиз {repo}",
    },
    "uk": {
        "latest_issue": "Нова задача в {repo}",
        "latest_pull_request": "Новий pull-запит у {repo}",
        "latest_release": "Новий реліз {repo}",
    },
    "hu": {
        "latest_issue": "Új hibajegy: {repo}",
        "latest_pull_request": "Új pull request: {repo}",
        "latest_release": "Új kiadás: {repo}",
    },
    "sk": {
        "latest_issue": "Nový problém v {repo}",
        "latest_pull_request": "Nový pull request v {repo}",
        "latest_release": "Nové vydanie {repo}",
    },
    "cs": {
        "latest_issue": "Nový problém v {repo}",
        "latest_pull_request": "Nový pull request v {repo}",
        "latest_release": "Nové vydání {repo}",
    },
    "sl": {
        "latest_issue": "Nova težava v {repo}",
        "latest_pull_request": "Nov pull request v {repo}",
        "latest_release": "Nova izdaja {repo}",
    },
    "lv": {
        "latest_issue": "Jauna problēma krātuvē {repo}",
        "latest_pull_request": "Jauns pull pieprasījums krātuvē {repo}",
        "latest_release": "Jauns laidiens krātuvē {repo}",
    },
    "el": {
        "latest_issue": "Νέο ζήτημα στο {repo}",
        "latest_pull_request": "Νέο pull request στο {repo}",
        "latest_release": "Νέα έκδοση του {repo}",
    },
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


def _tag(state: Any) -> str | None:
    if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
        return None
    tag = state.attributes.get("tag")
    return str(tag) if tag else None


class NewItemNotifier:
    """Watches the latest issue / pull request sensors of the GitHub integration."""

    def __init__(self, hass: HomeAssistant, options: Callable[[], dict[str, Any]]) -> None:
        self._hass = hass
        self._options = options
        self._watched: dict[str, str] | None = None  # entity id → kind, rebuilt when the registry changes

    @callback
    def async_start(self) -> Callable[[], None]:
        unsubs = [
            # The filter runs inline in the event bus: the many state changes of other entities never schedule
            # a call to _state_changed, only those of a watched sensor whose notification is on.
            self._hass.bus.async_listen(EVENT_STATE_CHANGED, self._state_changed, event_filter=self._is_watched),
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
    def _is_watched(self, event_data: Mapping[str, Any]) -> bool:
        kind = self._watch_list().get(event_data["entity_id"])
        return kind is not None and bool(self._options().get(KINDS[kind]))

    @callback
    def _state_changed(self, event: Event) -> None:
        entity_id = event.data["entity_id"]
        kind = self._watch_list().get(entity_id)
        if kind is None:  # The registry changed since the filter ran.
            return
        state = event.data["new_state"]
        if kind == "latest_release":
            old_tag, new_tag = _tag(event.data.get("old_state")), _tag(state)
            if old_tag is None or new_tag is None or new_tag == old_tag:
                return
            text = f"{new_tag} {state.state}" if state.state != new_tag else new_tag
        else:
            old, new = _number(event.data.get("old_state")), _number(state)
            if old is None or new is None or new <= old:
                return
            text = f"#{new} {state.state}"
        entry = er.async_get(self._hass).async_get(entity_id)
        device = dr.async_get(self._hass).async_get(entry.device_id) if entry and entry.device_id else None
        repo = device.name if device and device.name else entity_id
        lang = message_language(self._hass.config.language)
        title = MESSAGES[lang][kind].format(repo=repo)
        url = state.attributes.get("url")
        persistent_notification.async_create(
            self._hass,
            f"[{text}]({url})" if isinstance(url, str) and url.startswith("https://") else text,
            title=title,
            notification_id=f"{DOMAIN}_{kind}_{repo}",
        )
