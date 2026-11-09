"""The repositories offered by the GitHub integration's own flow, and the name patterns."""

from unittest.mock import MagicMock, patch

import voluptuous as vol
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers.selector import SelectSelector, SelectSelectorConfig
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card.repositories import async_offered, matches


async def test_offered_reads_the_flow_and_aborts_it(hass):
    gh = MockConfigEntry(domain="github")
    gh.add_to_hass(hass)
    schema = vol.Schema(
        {
            vol.Required("repository"): SelectSelector(
                SelectSelectorConfig(options=[{"value": "a/b", "label": "a/b"}, {"value": "c/d", "label": "c/d"}])
            )
        }
    )
    manager = MagicMock()
    manager.async_init = MagicMock(
        return_value=_coro({"type": FlowResultType.FORM, "flow_id": "f1", "data_schema": schema})
    )
    with patch.object(hass.config_entries, "subentries", manager):
        assert await async_offered(hass, gh) == ["a/b", "c/d"]
    manager.async_abort.assert_called_once_with("f1")
    init = manager.async_init.call_args
    assert init.args[0] == (gh.entry_id, "repository")


async def test_offered_none_when_the_flow_aborts_or_fails(hass):
    gh = MockConfigEntry(domain="github")
    gh.add_to_hass(hass)
    manager = MagicMock()
    manager.async_init = MagicMock(return_value=_coro({"type": FlowResultType.ABORT, "reason": "x"}))
    with patch.object(hass.config_entries, "subentries", manager):
        assert await async_offered(hass, gh) is None
        manager.async_init = MagicMock(side_effect=ValueError("unknown handler"))
        assert await async_offered(hass, gh) is None


def test_matches():
    assert matches("juju35/ha-parcel", "")
    assert matches("juju35/ha-parcel", "x/*, JUJU35/HA-*")
    assert not matches("juju35/aaos-parcel", "juju35/ha-*")


async def _value(v):
    return v


def _coro(v):
    return _value(v)


def test_plain_string_options_too():
    """The GitHub integration gives its repositories as plain strings."""
    selector = SelectSelector(SelectSelectorConfig(options=["a/b", "c/d"]))
    assert [o if isinstance(o, str) else o["value"] for o in selector.config["options"]] == ["a/b", "c/d"]
