"""Config flow: one entry, no question (the settings are edited in the sidebar panel)."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DEFAULTS, DOMAIN


class GitHubCardConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add the panel and the card."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is None:
            return self.async_show_form(step_id="user")
        return self.async_create_entry(title="GitHub Card", data={}, options=dict(DEFAULTS))
