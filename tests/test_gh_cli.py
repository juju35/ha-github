"""The GitHub CLI: its status, the repository creation with its protections, and the panel's commands."""

import json
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card import gh_cli
from custom_components.github_card.const import DOMAIN, REPO_DEFAULTS

SIGNED_IN = (0, "github.com\n  ✓ Logged in to github.com account juju35 (keyring)", "")
NONE = dict.fromkeys(gh_cli.REPO_PROTECTIONS, False)


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(domain=DOMAIN, title="GitHub Card", data={}, options={})
    entry.add_to_hass(hass)
    return entry


def _which(found: bool, git: bool = True):
    return patch.object(
        gh_cli.shutil,
        "which",
        side_effect=lambda name: f"/usr/bin/{name}" if found and (git or name != "git") else None,
    )


class FakeGh:
    """Answers gh (and git) by the command; records every call (arguments, stdin, program)."""

    def __init__(self, fail: tuple[str, ...] = (), template: dict | None = None):
        self.calls: list[tuple[tuple[str, ...], str | None, str | None]] = []
        self.fail = fail
        self.template = template or {}

    async def __call__(self, *args, stdin=None, program=None, cwd=None):
        self.calls.append((args, stdin, program))
        line = " ".join(args)
        if any(f in line for f in self.fail):
            return 1, "", f"failed: {line[:30]}"
        if args[:2] == ("auth", "status"):
            return SIGNED_IN
        if args[:2] == ("repo", "create"):
            target = args[2] if "/" in args[2] else f"juju35/{args[2]}"
            return 0, f"https://github.com/{target}\n", ""
        if args == ("api", "user"):
            return 0, json.dumps({"login": "juju35", "id": 575235, "name": "juju35", "email": None}), ""
        if args[:1] == ("api",) and args[1].endswith("/rulesets") and "--jq" in args:
            return 0, json.dumps(list(self.template)), ""
        if args[:1] == ("api",) and "/rulesets/" in args[1]:
            return 0, json.dumps(self.template[int(args[1].rsplit("/", 1)[1])]), ""
        return 0, "", ""

    def gh(self, first: str):
        return [c for c in self.calls if c[2] is None and c[0][:2] == tuple(first.split())]

    def posted_rulesets(self):
        return [json.loads(c[1]) for c in self.calls if c[0][:3] == ("api", "--method", "POST")]


async def test_status_not_installed(hass):
    with _which(False), patch.object(gh_cli, "_run", AsyncMock()) as run:
        status = await gh_cli.async_status(hass)
    assert status == {
        "installed": False,
        "authenticated": False,
        "login": None,
        "error": None,
        "path": None,
        "config_dir": None,
    }
    run.assert_not_called()


async def test_status_signed_in_then_cached(hass):
    with _which(True), patch.object(gh_cli, "_run", AsyncMock(return_value=SIGNED_IN)) as run:
        status = await gh_cli.async_status(hass)
        assert status == {
            "installed": True,
            "authenticated": True,
            "login": "juju35",
            "error": None,
            "path": "/usr/bin/gh",
            "config_dir": None,
        }
        await gh_cli.async_status(hass)
        assert run.await_count == 1
        await gh_cli.async_status(hass, refresh=True)
        assert run.await_count == 2
    run.assert_awaited_with("auth", "status", "--hostname", "github.com")


async def test_gh_in_the_configuration_folder(hass, tmp_path):
    """Home Assistant OS: gh put in /config/.gh/bin, signed in with GH_CONFIG_DIR=/config/.gh/config."""
    home = tmp_path / ".gh"
    (home / "bin").mkdir(parents=True)
    (home / "config").mkdir()
    binary = home / "bin" / "gh"
    binary.write_text("#!/bin/sh\n")
    binary.chmod(0o755)
    hass.config.config_dir = str(tmp_path)
    run = AsyncMock(return_value=SIGNED_IN)
    with _which(False), patch.object(gh_cli, "_run", run):
        status = await gh_cli.async_status(hass, refresh=True)
    assert status["installed"] and status["authenticated"]
    assert status["path"] == str(binary) and status["config_dir"] == str(home / "config")
    assert gh_cli._env()["GH_CONFIG_DIR"] == str(home / "config")
    # Not executable: not used; no config folder: gh's own default
    binary.chmod(0o644)
    (home / "config").rmdir()
    with _which(False), patch.object(gh_cli, "_run", run):
        status = await gh_cli.async_status(hass, refresh=True)
    assert not status["installed"] and status["config_dir"] is None
    assert "GH_CONFIG_DIR" not in gh_cli._env() or gh_cli._env()["GH_CONFIG_DIR"] == __import__("os").environ.get(
        "GH_CONFIG_DIR"
    )


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


async def test_create_with_the_usual_protections(hass):
    fake = FakeGh()
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await gh_cli.async_create(
            hass,
            name="ha-test-card",
            description="-A card",
            homepage="https://juju35.github.io/homeassistant-projects/projects/ha-test-card/",
            topics=["Lovelace", "hacs", "lovelace"],
            visibility="private",
        )
    assert result["ok"] and result["full_name"] == "juju35/ha-test-card"
    assert [s["step"] for s in result["steps"]] == [
        "empty_commit",
        "merge",
        "topics",
        "ruleset:main",
        "ruleset:tags v*",
    ]
    assert all(s["ok"] for s in result["steps"])
    assert fake.gh("repo create")[0][0] == (
        "repo",
        "create",
        "ha-test-card",
        "--private",
        "--description=-A card",
        "--homepage=https://juju35.github.io/homeassistant-projects/projects/ha-test-card/",
    )
    # The empty commit: git, authenticated through gh, pushed to main
    git = [c[0] for c in fake.calls if c[2] == "/usr/bin/git"]
    assert git[0] == ("init", "-q", "-b", "main")
    assert "--allow-empty" in git[1] and "user.email=575235+juju35@users.noreply.github.com" in git[1]
    assert "credential.helper=!/usr/bin/gh auth git-credential" in git[2]
    assert git[2][-2:] == ("https://github.com/juju35/ha-test-card.git", "HEAD:main")
    patch_call = next(c[0] for c in fake.calls if c[0][:3] == ("api", "--method", "PATCH"))
    for field in (
        "allow_squash_merge=true",
        "allow_merge_commit=false",
        "allow_rebase_merge=false",
        "squash_merge_commit_title=PR_TITLE",
        "squash_merge_commit_message=PR_BODY",
        "delete_branch_on_merge=true",
        "allow_auto_merge=false",
        "has_wiki=false",
    ):
        assert field in patch_call
    assert fake.gh("repo edit")[0][0] == (
        "repo",
        "edit",
        "juju35/ha-test-card",
        "--add-topic",
        "lovelace",
        "--add-topic",
        "hacs",
    )
    main, tags = fake.posted_rulesets()
    assert main["conditions"]["ref_name"]["include"] == ["~DEFAULT_BRANCH"]
    assert {r["type"] for r in main["rules"]} == {
        "deletion",
        "non_fast_forward",
        "pull_request",
        "required_linear_history",
    }
    pr = next(r for r in main["rules"] if r["type"] == "pull_request")
    assert pr["parameters"]["allowed_merge_methods"] == ["squash"]
    assert tags["target"] == "tag" and tags["conditions"]["ref_name"]["include"] == ["refs/tags/v*"]


async def test_create_without_protections(hass):
    fake = FakeGh()
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await gh_cli.async_create(hass, name="tools", owner="my-org", protect=NONE)
    assert result["full_name"] == "my-org/tools"
    assert fake.gh("repo create")[0][0] == ("repo", "create", "my-org/tools", "--public")
    assert [s["step"] for s in result["steps"]] == ["merge"]
    patch_call = next(c[0] for c in fake.calls if c[0][:3] == ("api", "--method", "PATCH"))
    assert "allow_squash_merge=true" not in patch_call and "delete_branch_on_merge=false" in patch_call
    assert fake.posted_rulesets() == []
    assert not [c for c in fake.calls if c[2] == "/usr/bin/git"]


async def test_create_rulesets_copied_from_a_template(hass):
    template = {
        7: {
            "id": 7,
            "name": "main",
            "target": "branch",
            "enforcement": "active",
            "source": "juju35/ha-room-card",
            "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
            "rules": [{"type": "deletion"}],
            "bypass_actors": [],
            "_links": {},
        },
        9: {
            "id": 9,
            "name": "tags",
            "target": "tag",
            "enforcement": "active",
            "conditions": {"ref_name": {"include": ["refs/tags/v*"], "exclude": []}},
            "rules": [{"type": "update"}],
            "bypass_actors": [],
        },
    }
    fake = FakeGh(template=template)
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await gh_cli.async_create(
            hass, name="x", protect={**NONE, "repo_protect_branch": True, "repo_rulesets_from": "juju35/ha-room-card"}
        )
    assert [s["step"] for s in result["steps"]] == ["merge", "ruleset:main", "ruleset:tags"]
    posted = fake.posted_rulesets()
    assert [r["name"] for r in posted] == ["main", "tags"]
    assert all(set(r) <= set(gh_cli.RULESET_KEYS) for r in posted)


async def test_create_steps_that_fail_are_reported(hass):
    fake = FakeGh(fail=("repo edit", "push -q", "rulesets"))
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await gh_cli.async_create(hass, name="x", topics=["a"])
    assert result["ok"]
    failed = {s["step"] for s in result["steps"] if not s["ok"]}
    assert failed == {"empty_commit", "topics", "ruleset:main", "ruleset:tags v*"}
    with _which(True, git=False), patch.object(gh_cli, "_run", FakeGh()):
        result = await gh_cli.async_create(hass, name="y")
    assert result["steps"][0] == {"step": "empty_commit", "ok": False, "error": "git is not installed"}
    fake = FakeGh(fail=("ha-room-card/rulesets",))
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await gh_cli.async_create(
            hass, name="z", protect={**NONE, "repo_rulesets_from": "juju35/ha-room-card"}
        )
    assert result["steps"][-1]["step"] == "rulesets" and not result["steps"][-1]["ok"]


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
        ({"name": "x", "protect": {"repo_rulesets_from": "--x/y"}}, "invalid_rulesets_from"),
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
    with _which(True), patch.object(gh_cli, "_run", FakeGh(fail=("repo create",))):
        result = await gh_cli.async_create(hass, name="x")
    assert result["error"] == "gh_failed" and result["message"].startswith("failed:")


async def test_run_gh_not_found(hass):
    # The gh found by an earlier status is forgotten (CI runners have a real gh)
    with (
        patch.object(gh_cli, "GH", "gh-does-not-exist-anywhere"),
        patch.dict(gh_cli._found, {"binary": None, "config": None}),
    ):
        code, _out, err = await gh_cli._run("--version")
    assert code == 127 and err


async def test_panel_commands_use_the_settings_defaults(hass, entry, hass_ws_client):
    assert await async_setup_component(hass, "lovelace", {})
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    client = await hass_ws_client(hass)
    # Defaults saved in Settings: no empty commit, no tags ruleset
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/update_settings", "repo_empty_commit": False, "repo_protect_tags": False}
    )
    msg = await client.receive_json()
    assert msg["result"]["settings"]["repo_protect_tags"] is False
    fake = FakeGh()
    with _which(True), patch.object(gh_cli, "_run", fake):
        await client.send_json_auto_id({"type": f"{DOMAIN}/gh_status"})
        msg = await client.receive_json()
        assert msg["result"]["authenticated"] and msg["result"]["login"] == "juju35"
        # This repository: the tags protected all the same
        await client.send_json_auto_id(
            {"type": f"{DOMAIN}/create_repo", "name": "new", "description": "d", "protect": {"repo_protect_tags": True}}
        )
        msg = await client.receive_json()
    assert msg["result"]["ok"] and msg["result"]["full_name"] == "juju35/new"
    assert [s["step"] for s in msg["result"]["steps"]] == ["merge", "ruleset:main", "ruleset:tags v*"]
    # The schema refuses an unknown visibility before gh runs
    await client.send_json_auto_id({"type": f"{DOMAIN}/create_repo", "name": "new", "visibility": "internal"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert REPO_DEFAULTS["repo_protect_branch"] is True
