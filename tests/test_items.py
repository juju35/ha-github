"""Open issues and pull requests of the followed repositories (GitHub GraphQL API, cached)."""

from datetime import timedelta

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.github_card.const import DOMAIN
from custom_components.github_card.items import GRAPHQL_URL, async_items, async_mine, build_query, parse

from .test_init import _setup, _ws


async def _poll_once(hass):
    """Let the background poller's deferred first fetch run."""
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=30))
    await hass.async_block_till_done()


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


async def test_items_command_reads_the_cache(hass, aioclient_mock, github, hass_ws_client):
    """A tab read returns the cache the background poller filled, without querying GitHub again."""
    aioclient_mock.post(GRAPHQL_URL, json=_answer())
    entry = MockConfigEntry(domain=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    await _setup(hass, entry)
    # A tab read before the first poll is pending, with no GitHub query.
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/items"})
    assert aioclient_mock.call_count == 0
    assert msg["result"]["pending"] is True
    # The background poll fills the cache; the next read serves it, still without a query.
    await _poll_once(hass)
    assert aioclient_mock.call_count == 1
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/items"})
    assert aioclient_mock.call_count == 1
    assert msg["result"]["issues"][0]["title"] == "Logo missing"
    assert msg["result"]["pulls"][0]["url"] == "https://github.com/juju35/ha-parcel/pull/97"
    assert msg["result"]["pending"] is False
    assert "tok" not in str(msg)


async def test_items_command_refresh_queries_github(hass, aioclient_mock, github, hass_ws_client):
    """The Refresh button (refresh=True) queries GitHub now."""
    aioclient_mock.post(GRAPHQL_URL, json=_answer())
    entry = MockConfigEntry(domain=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    await _setup(hass, entry)
    await _poll_once(hass)
    assert aioclient_mock.call_count == 1
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/items", "refresh": True})
    assert aioclient_mock.call_count == 2
    assert msg["result"]["issues"][0]["title"] == "Logo missing"


async def test_subscribe_items_pushes_the_cache(hass, aioclient_mock, github, hass_ws_client):
    """Subscribing sends the current snapshot at once."""
    aioclient_mock.post(GRAPHQL_URL, json=_answer())
    entry = MockConfigEntry(domain=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    await _setup(hass, entry)
    await _poll_once(hass)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/subscribe_items"})
    assert (await client.receive_json())["success"] is True
    event = await client.receive_json()
    assert event["event"]["issues"][0]["title"] == "Logo missing"


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


# ── My pull requests (the open pull requests authored by the token's user, in any repository) ──


def _mine_answer():
    """A GitHub search answer: two of the viewer's open pull requests, in repositories they do not follow."""
    pr = {
        **NODE,
        "number": 155412,
        "title": "Add diagnostics to the GitHub integration",
        "url": "https://github.com/home-assistant/core/pull/155412",
        "author": {"login": "juju35"},
        "isDraft": False,
        "reviewDecision": "REVIEW_REQUIRED",
        "repository": {"nameWithOwner": "home-assistant/core"},
        "commits": {"nodes": [{"commit": {"statusCheckRollup": {"state": "SUCCESS"}}}]},
    }
    older = {
        **pr,
        "number": 97,
        "title": "Translations: Greek",
        "url": "https://github.com/juju35/some-fork/pull/97",
        "updatedAt": "2026-11-02T10:00:00Z",
        "isDraft": True,
        "reviewDecision": None,
        "repository": {"nameWithOwner": "juju35/some-fork"},
        "commits": {"nodes": [{"commit": {"statusCheckRollup": None}}]},
    }
    return {"data": {"viewer": {"login": "juju35"}, "search": {"nodes": [older, pr]}}}


async def test_mine_parses_repo_review_and_checks(hass, aioclient_mock, github):
    aioclient_mock.post(GRAPHQL_URL, json=_mine_answer())
    mine = await async_mine(hass)
    assert mine.error is None and mine.viewer == "juju35"
    # Most recently updated first, across every repository (not only the followed ones)
    assert [p["number"] for p in mine.pulls] == [155412, 97]
    first = mine.pulls[0]
    assert first["repo"] == "home-assistant/core"
    assert first["review"] == "REVIEW_REQUIRED" and first["draft"] is False and first["checks"] == "SUCCESS"
    # A pull request with no rolled-up checks state carries None, not an error
    assert mine.pulls[1]["draft"] is True and mine.pulls[1]["checks"] is None


async def test_mine_cached_then_refreshed(hass, aioclient_mock, github):
    aioclient_mock.post(GRAPHQL_URL, json=_mine_answer())
    await async_mine(hass)
    assert aioclient_mock.call_count == 1
    assert aioclient_mock.mock_calls[0][3]["Authorization"] == "Bearer tok"
    await async_mine(hass)
    assert aioclient_mock.call_count == 1  # cached
    await async_mine(hass, refresh=True)
    assert aioclient_mock.call_count == 2


async def test_mine_errors(hass, aioclient_mock, github):
    aioclient_mock.post(GRAPHQL_URL, status=403)
    assert (await async_mine(hass)).error == "http_403"


async def test_mine_without_github_or_token(hass):
    assert (await async_mine(hass)).error == "github_not_configured"
    MockConfigEntry(domain="github", data={}).add_to_hass(hass)
    assert (await async_mine(hass)).error == "no_token"


async def test_mine_command_queries_github_and_hides_the_token(hass, aioclient_mock, github, hass_ws_client):
    """The My pull requests tab reads github_card/mine; the token never reaches the panel."""
    aioclient_mock.post(GRAPHQL_URL, json=_mine_answer())
    entry = MockConfigEntry(domain=DOMAIN, data={}, options={})
    entry.add_to_hass(hass)
    await _setup(hass, entry)
    msg = await _ws(hass, hass_ws_client, {"type": f"{DOMAIN}/mine"})
    assert msg["result"]["viewer"] == "juju35"
    assert msg["result"]["pulls"][0]["url"] == "https://github.com/home-assistant/core/pull/155412"
    assert msg["result"]["pending"] is False
    assert "tok" not in str(msg)
