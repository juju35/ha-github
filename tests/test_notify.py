"""Persistent notification for a new issue, pull request or release of a followed repository."""

from homeassistant.components import persistent_notification
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card.notify import MESSAGES, NewItemNotifier, message_language

ISSUE = "sensor.juju35_ha_parcel_latest_issue"


def _registry(hass):
    gh = MockConfigEntry(domain="github")
    gh.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=gh.entry_id, identifiers={("github", "juju35/ha-parcel")}, name="juju35/ha-parcel"
    )
    er.async_get(hass).async_get_or_create(
        "sensor",
        "github",
        "1_latest_issue",
        suggested_object_id="juju35_ha_parcel_latest_issue",
        device_id=device.id,
        translation_key="latest_issue",
    )


async def _notifications(hass):
    return persistent_notification._async_get_or_create_notifications(hass)


async def test_new_issue_notified_when_on(hass):
    _registry(hass)
    options = {"notify_issues": True}
    stop = NewItemNotifier(hass, lambda: options).async_start()
    hass.states.async_set(ISSUE, "Old", {"number": 5, "url": "https://github.com/juju35/ha-parcel/issues/5"})
    await hass.async_block_till_done()
    hass.states.async_set(
        ISSUE, "Carrier logo missing", {"number": 6, "url": "https://github.com/juju35/ha-parcel/issues/6"}
    )
    await hass.async_block_till_done()
    notes = await _notifications(hass)
    [note] = notes.values()
    assert note["title"] == "New issue in juju35/ha-parcel"
    assert note["message"] == "[#6 Carrier logo missing](https://github.com/juju35/ha-parcel/issues/6)"
    stop()


async def test_nothing_when_off_unavailable_or_same(hass):
    _registry(hass)
    options = {"notify_issues": False}
    stop = NewItemNotifier(hass, lambda: options).async_start()
    hass.states.async_set(ISSUE, "Old", {"number": 5})
    hass.states.async_set(ISSUE, "New", {"number": 6})
    options["notify_issues"] = True
    hass.states.async_set(ISSUE, "unavailable", {})
    hass.states.async_set(ISSUE, "New", {"number": 6})
    hass.states.async_set(ISSUE, "Same, renamed", {"number": 6})
    await hass.async_block_till_done()
    assert not await _notifications(hass)
    stop()


def test_messages_every_language():
    langs = {
        "en",
        "fr",
        "de",
        "es",
        "sr",
        "sr-Latn",
        "it",
        "nl",
        "pt",
        "pl",
        "ro",
        "da",
        "sv",
        "bg",
        "ru",
        "uk",
        "hu",
        "sk",
        "cs",
        "sl",
        "lv",
        "el",
    }
    assert set(MESSAGES) == langs
    for table in MESSAGES.values():
        assert set(table) == {"latest_issue", "latest_pull_request", "latest_release"}
        assert all("{repo}" in v for v in table.values())
    assert message_language("de-CH") == "de"
    assert message_language("sr-Latn") == "sr-Latn"
    assert message_language("ja") == "en"


async def test_filter_lets_only_watched_sensors_through(hass):
    _registry(hass)
    options = {"notify_issues": False}
    notifier = NewItemNotifier(hass, lambda: options)
    assert not notifier._is_watched({"entity_id": ISSUE})  # notification off
    options["notify_issues"] = True
    assert notifier._is_watched({"entity_id": ISSUE})
    assert not notifier._is_watched({"entity_id": "light.kitchen"})


RELEASE = "sensor.juju35_ha_parcel_latest_release"


async def test_new_release_notified_by_tag(hass):
    _registry(hass)
    device_id = er.async_get(hass).async_get(ISSUE).device_id
    er.async_get(hass).async_get_or_create(
        "sensor",
        "github",
        "1_latest_release",
        suggested_object_id="juju35_ha_parcel_latest_release",
        device_id=device_id,
        translation_key="latest_release",
    )
    options = {"notify_releases": True}
    stop = NewItemNotifier(hass, lambda: options).async_start()
    url = "https://github.com/juju35/ha-parcel/releases/tag/v1.2.0"
    hass.states.async_set(RELEASE, "v1.1.0", {"tag": "v1.1.0"})
    # Back from unavailable with the same tag (a reload): nothing new.
    hass.states.async_set(RELEASE, "unavailable", {})
    hass.states.async_set(RELEASE, "v1.1.0", {"tag": "v1.1.0"})
    await hass.async_block_till_done()
    assert not await _notifications(hass)
    hass.states.async_set(RELEASE, "Spring update", {"tag": "v1.2.0", "url": url})
    await hass.async_block_till_done()
    [note] = (await _notifications(hass)).values()
    assert note["title"] == "New release of juju35/ha-parcel"
    assert note["message"] == f"[v1.2.0 Spring update]({url})"
    # A release named after its tag says it once.
    persistent_notification.async_dismiss(hass, "github_card_latest_release_juju35/ha-parcel")
    hass.states.async_set(RELEASE, "v1.3.0", {"tag": "v1.3.0"})
    await hass.async_block_till_done()
    [note] = (await _notifications(hass)).values()
    assert note["message"] == "v1.3.0"
    stop()
