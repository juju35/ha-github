"""The GitHub CLI: its status, the repository creation and the panel's commands."""

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card import gh_cli
from custom_components.github_card.const import DOMAIN

SIGNED_IN = (0, "github.com\n  ✓ Logged in to github.com account juju35 (keyring)", "")


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(domain=DOMAIN, title="GitHub Card", data={}, options={})
    entry.add_to_hass(hass)
    return entry


def _which(found: bool):
    return patch.object(gh_cli.shutil, "which", return_value="/usr/bin/gh" if found else None)


async def test_status_not_installed(hass):
    with _which(False), patch.object(gh_cli, "_run", AsyncMock()) as run:
        status = await gh_cli.async_status(hass)
    assert status == {"installed": False, "authenticated": False, "login": None, "error": None}
    run.assert_not_called()


async def test_status_signed_in_then_cached(hass):
    with _which(True), patch.object(gh_cli, "_run", AsyncMock(return_value=SIGNED_IN)) as run:
        status = await gh_cli.async_status(hass)
        assert status == {"installed": True, "authenticated": True, "login": "juju35", "error": None}
        await gh_cli.async_status(hass)
        assert run.await_count == 1
        await gh_cli.async_status(hass, refresh=True)
        assert run.await_count == 2
    run.assert_awaited_with("auth", "status", "--hostname", "github.com")


async def test_status_old_gh_on_stderr_and_not_signed_in(hass):
    with _which(True), patch.object(gh_cli, "_run", AsyncMock(return_value=(0, "", "Logged in to github.com as octo"))):
        assert (await gh_cli.async_status(hass, refresh=True))["login"] == "octo"
    with (
        _which(True),
        patch.object(gh_cli, "_run", AsyncMock(return_value=(1, "", "You are not logged into any GitHub hosts."))),
    ):
        status = await gh_cli.async_status(hass, refresh=True)
    assert status["installed"] and not status["authenticated"]
    assert "not logged" in status["error"]


async def test_create_with_topics(hass):
    run = AsyncMock(side_effect=[SIGNED_IN, (0, "https://github.com/juju35/ha-test-card\n", ""), (0, "", "")])
    with _which(True), patch.object(gh_cli, "_run", run):
        result = await gh_cli.async_create(
            hass,
            name="ha-test-card",
            description="-A card",
            homepage="https://juju35.github.io/homeassistant-projects/projects/ha-test-card/",
            topics=["Lovelace", "hacs", "lovelace"],
            visibility="private",
        )
    assert result == {
        "ok": True,
        "full_name": "juju35/ha-test-card",
        "url": "https://github.com/juju35/ha-test-card",
        "topics": ["lovelace", "hacs"],
    }
    assert run.await_args_list[1].args == (
        "repo",
        "create",
        "ha-test-card",
        "--private",
        "--description=-A card",
        "--homepage=https://juju35.github.io/homeassistant-projects/projects/ha-test-card/",
    )
    assert run.await_args_list[2].args == (
        "repo",
        "edit",
        "juju35/ha-test-card",
        "--add-topic",
        "lovelace",
        "--add-topic",
        "hacs",
    )


async def test_create_in_an_organization_without_topics(hass):
    run = AsyncMock(side_effect=[SIGNED_IN, (0, "", "")])
    with _which(True), patch.object(gh_cli, "_run", run):
        result = await gh_cli.async_create(hass, name="tools", owner="my-org")
    assert result["full_name"] == "my-org/tools"
    assert run.await_args_list[1].args == ("repo", "create", "my-org/tools", "--public")
    assert run.await_count == 2


async def test_create_topics_failed_still_created(hass):
    run = AsyncMock(side_effect=[SIGNED_IN, (0, "https://github.com/juju35/x\n", ""), (1, "", "HTTP 422")])
    with _which(True), patch.object(gh_cli, "_run", run):
        result = await gh_cli.async_create(hass, name="x", topics=["a"])
    assert result["ok"] and result["topics_error"] == "HTTP 422"


@pytest.mark.parametrize(
    ("kwargs", "error"),
    [
        ({"name": "-x"}, "invalid_name"),
        ({"name": ".x"}, "invalid_name"),
        ({"name": "a b"}, "invalid_name"),
        ({"name": "x", "owner": "--org"}, "invalid_owner"),
        ({"name": "x", "description": "a\nb"}, "invalid_description"),
        ({"name": "x", "topics": ["no_way"]}, "invalid_topics"),
        ({"name": "x", "topics": [f"t{i}" for i in range(21)]}, "invalid_topics"),
        ({"name": "x", "visibility": "internal"}, "invalid_visibility"),
        ({"name": "x", "homepage": "javascript:alert(1)"}, "invalid_homepage"),
        ({"name": "x", "homepage": "--web"}, "invalid_homepage"),
        ({"name": "x", "homepage": "https://a b"}, "invalid_homepage"),
    ],
)
async def test_create_rejects_invalid_values(hass, kwargs, error):
    run = AsyncMock(return_value=SIGNED_IN)
    with _which(True), patch.object(gh_cli, "_run", run):
        result = await gh_cli.async_create(hass, **kwargs)
    assert result == {"ok": False, "error": error}
    assert run.await_count == 1  # only gh auth status


async def test_create_gh_errors(hass):
    with _which(False):
        assert (await gh_cli.async_create(hass, name="x"))["error"] == "gh_missing"
    with _which(True), patch.object(gh_cli, "_run", AsyncMock(return_value=(1, "", "no"))):
        assert (await gh_cli.async_create(hass, name="x"))["error"] == "gh_not_authenticated"
    run = AsyncMock(side_effect=[SIGNED_IN, (1, "", "GraphQL: Name already exists on this account")])
    with _which(True), patch.object(gh_cli, "_run", run):
        result = await gh_cli.async_create(hass, name="x")
    assert result == {"ok": False, "error": "gh_failed", "message": "GraphQL: Name already exists on this account"}


async def test_run_gh_not_found(hass):
    with patch.object(gh_cli, "GH", "gh-does-not-exist-anywhere"):
        code, _out, err = await gh_cli._run("--version")
    assert code == 127 and err


async def test_panel_commands(hass, entry, hass_ws_client):
    assert await async_setup_component(hass, "lovelace", {})
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    client = await hass_ws_client(hass)
    run = AsyncMock(side_effect=[SIGNED_IN, SIGNED_IN, (0, "https://github.com/juju35/new\n", "")])
    with _which(True), patch.object(gh_cli, "_run", run):
        await client.send_json_auto_id({"type": f"{DOMAIN}/gh_status"})
        msg = await client.receive_json()
        assert msg["result"]["authenticated"] and msg["result"]["login"] == "juju35"
        await client.send_json_auto_id({"type": f"{DOMAIN}/create_repo", "name": "new", "description": "d"})
        msg = await client.receive_json()
    assert msg["result"]["ok"] and msg["result"]["full_name"] == "juju35/new"
    # The schema refuses an unknown visibility before gh runs
    await client.send_json_auto_id({"type": f"{DOMAIN}/create_repo", "name": "new", "visibility": "internal"})
    msg = await client.receive_json()
    assert not msg["success"]
