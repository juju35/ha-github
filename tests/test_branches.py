"""Branches of the token user's repositories: the GraphQL pages, the cache, and deleting branches."""

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.github_card import branches as br
from custom_components.github_card.const import DOMAIN

API = "https://api.github.com"


def _page(repos, has_next=False, cursor=None):
    return {
        "data": {
            "viewer": {
                "login": "juju35",
                "repositories": {
                    "pageInfo": {"hasNextPage": has_next, "endCursor": cursor},
                    "nodes": repos,
                },
            }
        }
    }


def _repo(name, default, refs):
    return {
        "nameWithOwner": f"juju35/{name}",
        "defaultBranchRef": {"name": default},
        "refs": {
            "totalCount": len(refs),
            "nodes": [
                {
                    "name": ref,
                    "target": {"committedDate": date},
                    "associatedPullRequests": {
                        "nodes": [{"number": pr, "url": f"https://github.com/juju35/{name}/pull/{pr}"}] if pr else []
                    },
                }
                for ref, date, pr in refs
            ],
        },
    }


@pytest.fixture
def github(hass):
    gh = MockConfigEntry(domain="github", data={"access_token": "x"})
    gh.add_to_hass(hass)
    return gh


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(domain=DOMAIN, title="GitHub Card", data={}, options={})
    entry.add_to_hass(hass)
    return entry


def test_parse_leaves_out_default_branches_oldest_first():
    pages = [
        _page(
            [_repo("ha-a", "main", [("main", "2026-11-20T00:00:00Z", None), ("feat/x", "2026-11-10T00:00:00Z", 12)])]
        ),
        _page([_repo("ha-b", "master", [("old", "2026-01-02T00:00:00Z", None)]), None]),
    ]
    found, repos, login = br.parse([p["data"] for p in pages])
    assert login == "juju35" and repos == 2
    assert [(b["repo"], b["branch"]) for b in found] == [("juju35/ha-b", "old"), ("juju35/ha-a", "feat/x")]
    assert found[1]["pr"] == {"number": 12, "url": "https://github.com/juju35/ha-a/pull/12"}
    assert found[0]["pr"] is None and found[0]["default"] == "master"


async def test_branches_paginated_then_cached(hass, github, aioclient_mock: AiohttpClientMocker):
    aioclient_mock.post(
        br.GRAPHQL_URL,
        json=_page([_repo("ha-a", "main", [("dev", "2026-10-01T00:00:00Z", None)])], has_next=False),
    )
    result = await br.async_branches(hass)
    assert result.error is None and [b["branch"] for b in result.branches] == ["dev"]
    await br.async_branches(hass)
    assert aioclient_mock.call_count == 1
    await br.async_branches(hass, refresh=True)
    assert aioclient_mock.call_count == 2


async def test_branches_errors(hass, aioclient_mock: AiohttpClientMocker):
    assert (await br.async_branches(hass)).error == "github_not_configured"
    MockConfigEntry(domain="github", data={"access_token": "x"}).add_to_hass(hass)
    aioclient_mock.post(br.GRAPHQL_URL, status=401)
    assert (await br.async_branches(hass, refresh=True)).error == "http_401"


async def test_delete_branches_with_gh(hass, github, aioclient_mock: AiohttpClientMocker):
    aioclient_mock.post(
        br.GRAPHQL_URL,
        json=_page(
            [
                _repo(
                    "ha-a",
                    "main",
                    [
                        ("feat/x", "2026-10-01T00:00:00Z", None),
                        ("gone", "2026-10-01T00:00:00Z", None),
                        ("locked", "2026-10-01T00:00:00Z", None),
                    ],
                )
            ]
        ),
    )
    await br.async_branches(hass)

    async def api(*args):
        path = args[-1]
        if path.endswith("/gone"):
            return "gh: Reference does not exist (HTTP 422)"
        if path.endswith("/locked"):
            return "gh: Resource not accessible (HTTP 403)"
        return None

    calls = AsyncMock(side_effect=api)
    with (
        patch.object(br.gh_cli, "async_status", AsyncMock(return_value={"installed": True, "authenticated": True})),
        patch.object(br.gh_cli, "async_api", calls),
    ):
        result = await br.async_delete(
            hass,
            [
                {"repo": "juju35/ha-a", "branch": "feat/x"},
                {"repo": "juju35/ha-a", "branch": "gone"},
                {"repo": "juju35/ha-a", "branch": "locked"},
                {"repo": "juju35/ha-z", "branch": "develop"},
                {"repo": "juju35/ha-a", "branch": "main"},
                {"repo": "juju35/ha-b", "branch": "master"},
                {"repo": "juju35/ha-a", "branch": "../x"},
            ],
        )
    by = {r["branch"]: r for r in result["results"]}
    assert by["feat/x"]["ok"] and by["gone"]["ok"]
    assert by["develop"]["error"] == "not_listed"
    assert by["locked"]["error"] == "gh: Resource not accessible (HTTP 403)"
    assert by["main"]["error"] == "default_branch" and by["master"]["error"] == "default_branch"
    assert by["../x"]["error"] == "invalid"
    assert ("--method", "DELETE", "repos/juju35/ha-a/git/refs/heads/feat/x") in [c.args for c in calls.await_args_list]
    assert calls.await_count == 3  # never for the default, unlisted or invalid branches
    # The deleted ones leave the cached list
    assert [b["branch"] for b in hass.data[DOMAIN][br.CACHE].branches] == ["locked"]


async def test_delete_needs_gh(hass, github):
    with patch.object(br.gh_cli, "async_status", AsyncMock(return_value={"installed": False, "authenticated": False})):
        assert await br.async_delete(hass, [{"repo": "juju35/ha-a", "branch": "x"}]) == {
            "ok": False,
            "error": "gh_missing",
        }
    with patch.object(br.gh_cli, "async_status", AsyncMock(return_value={"installed": True, "authenticated": False})):
        result = await br.async_delete(hass, [{"repo": "juju35/ha-a", "branch": "x"}])
    assert result["error"] == "gh_not_authenticated"


async def test_panel_commands(hass, entry, github, hass_ws_client, aioclient_mock: AiohttpClientMocker):
    assert await async_setup_component(hass, "lovelace", {})
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    aioclient_mock.post(br.GRAPHQL_URL, json=_page([_repo("ha-a", "main", [("dev", "2026-10-01T00:00:00Z", None)])]))
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/branches", "refresh": True})
    msg = await client.receive_json()
    assert msg["result"]["branches"][0]["branch"] == "dev"
    await client.send_json_auto_id({"type": f"{DOMAIN}/update_settings", "branch_age_days": 30})
    msg = await client.receive_json()
    assert msg["result"]["settings"]["branch_age_days"] == 30
    await client.send_json_auto_id({"type": f"{DOMAIN}/delete_branches", "branches": []})
    msg = await client.receive_json()
    assert not msg["success"]
