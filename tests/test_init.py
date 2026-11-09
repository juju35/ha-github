"""Setup, config flow, the panel, the card resource and the panel's WebSocket commands."""

from unittest.mock import patch

import pytest
from homeassistant.components.frontend import DATA_PANELS
from homeassistant.config_entries import SOURCE_USER, ConfigEntryState
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card.const import CARD_URL, DOMAIN, PANEL_PATH, PANEL_URL, VERSION

OWN = ["juju35/ha-parcel", "juju35/ha-weather-card", "juju35/aaos-parcel"]
STARRED = ["home-assistant/core"]


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(domain=DOMAIN, title="GitHub Card", data={}, options={})
    entry.add_to_hass(hass)
    return entry


@pytest.fixture
def github(hass):
    """The core GitHub integration's entry, following ha-parcel, with its account device."""
    gh = MockConfigEntry(
        domain="github",
        data={"access_token": "x"},
        subentries_data=[
            {
                "data": {"repository": "juju35/ha-parcel"},
                "subentry_type": "repository",
                "title": "juju35/ha-parcel",
                "unique_id": "juju35/ha-parcel",
            }
        ],
    )
    gh.add_to_hass(hass)
    dr.async_get(hass).async_get_or_create(
        config_entry_id=gh.entry_id, identifiers={("github", "575235")}, name="juju35"
    )
    return gh


async def _setup(hass, entry):
    assert await async_setup_component(hass, "lovelace", {})
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def _ws(hass, hass_ws_client, payload):
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(payload)
    return await client.receive_json()


async def test_config_flow_single_entry(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"] == {"filter": "", "include_starred": False, "notify_issues": False, "notify_pulls": False}
    again = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert again["type"] is FlowResultType.ABORT
    assert again["reason"] == "single_instance_allowed"


async def test_panel_for_admins_and_files_served(hass, entry, hass_client):
    await _setup(hass, entry)
    assert entry.state is ConfigEntryState.LOADED
    panel = hass.data[DATA_PANELS][PANEL_PATH]
    assert panel.require_admin
    assert panel.sidebar_title == "GitHub"
    assert panel.config["_panel_custom"]["module_url"] == f"{PANEL_URL}?v={VERSION}"
    client = await hass_client()
    for url, marker in ((PANEL_URL, f'GITHUB_PANEL_VERSION = "{VERSION}"'), (CARD_URL, f'const VERSION = "{VERSION}"')):
        resp = await client.get(url)
        assert resp.status == 200
        assert marker in await resp.text()


async def test_unload_removes_panel(hass, entry):
    await _setup(hass, entry)
    await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_PATH not in hass.data[DATA_PANELS]
    # Loaded again: the panel comes back
    await hass.config_entries.async_setup(entry.entry_id)
    assert PANEL_PATH in hass.data[DATA_PANELS]


async def test_card_resource_replaces_the_former_dashboard_card(hass, entry):
    assert await async_setup_component(hass, "lovelace", {})
    resources = hass.data["lovelace"].resources
    await resources.async_get_info()
    await resources.async_create_item(
        {"res_type": "module", "url": "/hacsfiles/ha-github-card/github-card.js?hacstag=1"}
    )
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    urls = [item["url"] for item in resources.async_items()]
    assert urls == [f"{CARD_URL}?v={VERSION}"]
    # Removed with the entry
    await hass.config_entries.async_remove(entry.entry_id)
    assert not list(resources.async_items())


async def test_repositories_without_github(hass, entry, hass_ws_client):
    await _setup(hass, entry)
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/repositories"})
    assert msg["result"]["configured"] is False


async def test_repositories_own_then_starred_then_filter(hass, entry, github, hass_ws_client):
    await _setup(hass, entry)
    github.mock_state(hass, ConfigEntryState.LOADED)
    offered = [n for n in OWN + STARRED if n != "juju35/ha-parcel"]
    with patch("custom_components.github_card.repositories.async_offered", return_value=offered):
        msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/repositories"})
        r = msg["result"]
        assert r["login"] == "juju35"
        assert r["followed"] == ["juju35/ha-parcel"]
        assert r["offered"] == ["juju35/aaos-parcel", "juju35/ha-weather-card"]
        assert r["offered_error"] is False

        msg = await _ws(
            hass,
            hass_ws_client,
            {
                "type": f"{DOMAIN}/update_settings",
                "include_starred": True,
                "filter": " juju35/ha-* ,, home-assistant/* ",
            },
        )
        assert msg["result"]["settings"]["filter"] == "juju35/ha-*, home-assistant/*"
        assert entry.options["include_starred"] is True
        msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/repositories"})
        assert msg["result"]["offered"] == ["home-assistant/core", "juju35/ha-weather-card"]


async def test_repositories_not_loaded(hass, entry, github, hass_ws_client):
    await _setup(hass, entry)
    with patch("custom_components.github_card.repositories.async_offered") as offered:
        msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/repositories"})
    offered.assert_not_called()
    assert msg["result"]["state"] == "not_loaded"
    assert msg["result"]["followed"] == ["juju35/ha-parcel"]
    assert msg["result"]["offered_error"] is True


async def test_follow_and_unfollow_in_one_reload(hass, entry, github, hass_ws_client):
    await _setup(hass, entry)
    github.mock_state(hass, ConfigEntryState.LOADED)
    with (
        patch(
            "custom_components.github_card.repositories.async_offered",
            return_value=["juju35/ha-weather-card", "juju35/aaos-parcel"],
        ),
        patch.object(hass.config_entries, "async_unload", return_value=True) as unload,
        patch.object(hass.config_entries, "async_setup", return_value=True) as setup,
    ):
        msg = await _ws(
            hass,
            hass_ws_client,
            {
                "type": f"{DOMAIN}/follow",
                "add": ["JUJU35/ha-weather-card", "juju35/aaos-parcel", "juju35/nope"],
                "remove": ["juju35/ha-parcel"],
            },
        )
    result = msg["result"]
    assert result["ok"]
    assert result["added"] == ["juju35/ha-weather-card", "juju35/aaos-parcel"]
    assert result["removed"] == ["juju35/ha-parcel"]
    assert result["skipped"] == ["juju35/nope"]
    assert unload.call_count == 1
    assert setup.call_count == 1
    names = sorted(s.data["repository"] for s in github.subentries.values())
    assert names == ["juju35/aaos-parcel", "juju35/ha-weather-card"]
    assert all(
        s.unique_id == s.data["repository"] and s.subentry_type == "repository" for s in github.subentries.values()
    )


async def test_follow_nothing_new_does_not_reload(hass, entry, github, hass_ws_client):
    await _setup(hass, entry)
    with patch.object(hass.config_entries, "async_unload") as unload:
        msg = await _ws(
            hass, hass_ws_client, {"type": f"{DOMAIN}/follow", "add": ["juju35/ha-parcel"], "remove": ["juju35/x"]}
        )
    assert msg["result"] == {"ok": True, "added": [], "removed": [], "skipped": ["juju35/x"]}
    unload.assert_not_called()


async def test_follow_errors(hass, entry, github, hass_ws_client):
    await _setup(hass, entry)
    with patch("custom_components.github_card.repositories.async_offered", return_value=None):
        msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/follow", "add": ["juju35/ha-weather-card"]})
    assert msg["result"] == {"ok": False, "error": "offered_unavailable"}
    # A name that is not owner/repo is refused by the schema
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/follow", "add": ["not a repo"]})
    assert not msg["success"]


async def test_follow_without_github(hass, entry, hass_ws_client):
    await _setup(hass, entry)
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/follow", "add": ["juju35/ha-parcel"]})
    assert msg["result"] == {"ok": False, "error": "github_not_configured"}


async def test_commands_need_an_admin(hass, entry, hass_ws_client, hass_read_only_access_token):
    await _setup(hass, entry)
    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json_auto_id({"type": f"{DOMAIN}/repositories"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "unauthorized"
