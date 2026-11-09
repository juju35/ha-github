"""Constants for the GitHub Card integration."""

DOMAIN = "github_card"
VERSION = "2.3.0"

# The core GitHub integration, whose repositories the panel follows and unfollows
GITHUB_DOMAIN = "github"
SUBENTRY_TYPE = "repository"
CONF_REPOSITORY = "repository"

# Files served by the integration, and the sidebar panel (its own path, not /github_card,
# so the frontend's panel route never shadows the files)
URL_BASE = f"/{DOMAIN}"
CARD_URL = f"{URL_BASE}/github-card.js"
PANEL_URL = f"{URL_BASE}/github-panel.js"
PANEL_PATH = "github-config"
# Resource of the card installed as a dashboard plugin before 2.0, replaced by the integration's
LEGACY_CARD_PATH = "/ha-github-card/github-card.js"

# Settings (options of the config entry), edited in the panel
CONF_FILTER = "filter"
CONF_INCLUDE_STARRED = "include_starred"
CONF_NOTIFY_ISSUES = "notify_issues"
CONF_NOTIFY_PULLS = "notify_pulls"
DEFAULTS = {
    CONF_FILTER: "",
    CONF_INCLUDE_STARRED: False,
    CONF_NOTIFY_ISSUES: False,
    CONF_NOTIFY_PULLS: False,
}
MAX_FILTER_LENGTH = 500
