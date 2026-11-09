"""Open issues and pull requests of the followed repositories (GitHub GraphQL API, cached)."""

import pytest
from homeassistant.config_entries import ConfigEntryState
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card.const import DOMAIN
from custom_components.github_card.items import GRAPHQL_URL, async_items, build_query, parse

from .test_init import _setup, _ws

NODE = {
    "number": 97,
    "title": "Translations: Greek",
    "url": "https://github.com/juju35/ha-parcel/pull/97",
    "createdAt": "2026-11-01T10:00:00Z",
    "updatedAt": "2026-11-08T10:00:00Z",
    "author": {"login": "octocat"},
    "comments": {"totalCount": 2},
    "labels": {"nodes": [{"name": "i18n", "color": "0e8a16"}]},
}


def _answer():
    issue = {
        **NODE,
        "number": 94,
        "title": "Logo missing",
        "url": "https://github.com/juju35/ha-parcel/issues/94",
        "updatedAt": "2026-11-09T08:00:00Z",
    }
    return {
        "data": {
            "r0": {
                "nameWithOwner": "juju35/ha-parcel",
                "issues": {"totalCount": 3, "nodes": [issue]},
                "pullRequests": {"totalCount": 1, "nodes": [{**NODE, "isDraft": False, "reviewDecision": "APPROVED"}]},
            },
            "r1": None,
        }
    }


@pytest.fixture
def github(hass):
    gh = MockConfigEntry(
        domain="github",
        data={"access_token": "tok"},
        subentries_data=[
            {"data": {"repository": n}, "subentry_type": "repository", "title": n, "unique_id": n}
            for n in ("juju35/ha-parcel", "juju35/gone")
        ],
    )
    gh.add_to_hass(hass)
    gh.mock_state(hass, ConfigEntryState.NOT_LOADED)
    return gh


def test_query_quotes_names():
    query = build_query(["juju35/ha-parcel", 'a/b"c'])
    assert 'r0: repository(owner: "juju35", name: "ha-parcel")' in query
    assert 'name: "b\\"c"' in query
    assert "states: OPEN" in query and "isDraft reviewDecision" in query


def test_parse_sorts_newest_first_and_skips_missing():
    issues, pulls, totals = parse(_answer()["data"])
    assert [i["number"] for i in issues] == [94]
    assert pulls[0]["review"] == "APPROVED" and pulls[0]["draft"] is False
    assert pulls[0]["labels"] == [{"name": "i18n", "color": "0e8a16"}]
    assert totals == {"juju35/ha-parcel": {"issues": 3, "pulls": 1}}


async def test_items_cached_then_refreshed(hass, aioclient_mock, github):
    aioclient_mock.post(GRAPHQL_URL, json=_answer())
    items = await async_items(hass)
    assert items.error is None
    assert aioclient_mock.call_count == 1
    assert aioclient_mock.mock_calls[0][3]["Authorization"] == "Bearer tok"
    await async_items(hass)
    assert aioclient_mock.call_count == 1  # cached
    await async_items(hass, refresh=True)
    assert aioclient_mock.call_count == 2


async def test_items_errors(hass, aioclient_mock, github):
    aioclient_mock.post(GRAPHQL_URL, status=401)
    assert (await async_items(hass)).error == "http_401"


async def test_items_without_github_or_repositories(hass):
    assert (await async_items(hass)).error == "github_not_configured"
    MockConfigEntry(domain="github", data={"access_token": "tok"}).add_to_hass(hass)
    items = await async_items(hass)
    assert items.error is None and items.issues == [] and items.pulls == []


async def test_items_command(hass, aioclient_mock, github, hass_ws_client):
    entry = MockConfigEntry(domain=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    await _setup(hass, entry)
    aioclient_mock.post(GRAPHQL_URL, json=_answer())
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/items"})
    assert msg["result"]["issues"][0]["title"] == "Logo missing"
    assert msg["result"]["pulls"][0]["url"] == "https://github.com/juju35/ha-parcel/pull/97"
    assert "tok" not in str(msg)


def test_a_repository_followed_under_two_names_is_counted_once():
    """The former name of a renamed repository redirects to it: GitHub answers twice with the same repository."""
    answer = _answer()["data"]
    answer["r1"] = answer["r0"]
    issues, pulls, totals = parse(answer)
    assert [p["number"] for p in pulls] == [97]
    assert [i["number"] for i in issues] == [94]
    assert totals == {"juju35/ha-parcel": {"issues": 3, "pulls": 1}}
    # Across two queries (20 repositories each) too
    seen = set()
    parse(_answer()["data"], seen)
    assert parse(_answer()["data"], seen) == ([], [], {})
