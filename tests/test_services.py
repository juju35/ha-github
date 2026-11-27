"""The github_card.create_repository action: administrators only, the Settings defaults, errors raised."""

from unittest.mock import patch

import pytest
from homeassistant.core import Context
from homeassistant.exceptions import HomeAssistantError, Unauthorized
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card import gh_cli
from custom_components.github_card.const import DOMAIN

from .test_gh_cli import FakeGh, _which


@pytest.fixture
async def entry(hass):
    assert await async_setup_component(hass, "lovelace", {})
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="GitHub Card",
        data={},
        options={
            "repo_homepage": "https://example.org/projects/{owner}/{name}/",
            "repo_topics": "home-assistant, lovelace",
            "repo_visibility": "private",
            "repo_protect_tags": False,
        },
    )
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _create(hass, context=None, **data):
    return await hass.services.async_call(
        DOMAIN, "create_repository", data, blocking=True, return_response=True, context=context
    )


async def test_create_with_the_settings_defaults(hass, entry):
    fake = FakeGh()
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await _create(hass, name="ha-airing-card", description="Air the rooms")
    assert result["full_name"] == "juju35/ha-airing-card"
    assert result["url"] == "https://github.com/juju35/ha-airing-card"
    assert result["topics"] == ["home-assistant", "lovelace"]
    assert fake.gh("repo create")[0][0] == (
        "repo",
        "create",
        "ha-airing-card",
        "--private",
        "--description=Air the rooms",
        "--homepage=https://example.org/projects/juju35/ha-airing-card/",
    )
    # The tags ruleset is off in Settings
    assert [s["step"] for s in result["steps"]] == ["empty_commit", "merge", "topics", "ruleset:main"]


async def test_create_overrides_the_defaults(hass, entry):
    fake = FakeGh()
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await _create(
            hass,
            name="tools",
            owner="my-org",
            homepage="",
            topics="python cli",
            visibility="public",
            protect={"repo_empty_commit": False, "repo_protect_tags": True},
        )
    assert result["full_name"] == "my-org/tools" and result["topics"] == ["python", "cli"]
    assert fake.gh("repo create")[0][0] == ("repo", "create", "my-org/tools", "--public")
    assert [s["step"] for s in result["steps"]] == ["merge", "topics", "ruleset:main", "ruleset:tags v*"]


async def test_create_failure_raises(hass, entry):
    with (
        _which(True),
        patch.object(gh_cli, "_run", FakeGh(fail=("repo create",))),
        pytest.raises(HomeAssistantError) as err,
    ):
        await _create(hass, name="new")
    assert err.value.translation_key == "create_repository_failed"
    assert err.value.translation_placeholders["error"].startswith("gh_failed: failed:")
    with _which(False), pytest.raises(HomeAssistantError) as err:
        await _create(hass, name="new")
    assert err.value.translation_placeholders["error"] == "gh_missing"


async def test_create_is_for_administrators_only(hass, entry, hass_read_only_user):
    user = hass_read_only_user
    assert not user.is_admin
    fake = FakeGh()
    with _which(True), patch.object(gh_cli, "_run", fake), pytest.raises(Unauthorized):
        await _create(hass, context=Context(user_id=user.id), name="new")
    assert not fake.calls


async def test_create_copies_the_rulesets_of_the_settings_template(hass, entry):
    options = {**entry.options, "repo_rulesets_from": "juju35/ha-room-card"}
    hass.config_entries.async_update_entry(entry, options=options)
    fake = FakeGh(template={1: {"name": "main", "target": "branch", "enforcement": "active", "id": 1}})
    with _which(True), patch.object(gh_cli, "_run", fake):
        result = await _create(hass, name="ha-airing-card")
    assert [s["step"] for s in result["steps"]][-1] == "ruleset:main"
    assert any(c[0][1] == "repos/juju35/ha-room-card/rulesets" for c in fake.calls if c[0][:1] == ("api",))
