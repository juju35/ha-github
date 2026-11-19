"""Constants for the GitHub Card integration."""

DOMAIN = "github_card"
VERSION = "2.13.0"

# The core GitHub integration, whose repositories the panel follows and unfollows
GITHUB_DOMAIN = "github"
SUBENTRY_TYPE = "repository"
CONF_REPOSITORY = "repository"

# Files served by the integration, and the sidebar panel (its own path, not /github_card,
# so the frontend's panel route never shadows the files)
URL_BASE = f"/{DOMAIN}"
CARD_URL = f"{URL_BASE}/github-card.js"
PANEL_URL = f"{URL_BASE}/github-panel.js"
# Loaded on every page: the sidebar badge (open issues and pull requests count on the GitHub panel item)
BADGE_URL = f"{URL_BASE}/github-badge.js"
PANEL_PATH = "github-config"
# Resource of the card installed as a dashboard plugin before 2.0, replaced by the integration's
LEGACY_CARD_PATH = "/ha-github-card/github-card.js"

# Settings (options of the config entry), edited in the panel
CONF_FILTER = "filter"
CONF_INCLUDE_STARRED = "include_starred"
CONF_IGNORE_ARCHIVED = "ignore_archived"
CONF_NOTIFY_ISSUES = "notify_issues"
CONF_NOTIFY_PULLS = "notify_pulls"
CONF_NOTIFY_RELEASES = "notify_releases"
# How often the open issues and pull requests are fetched from GitHub, in minutes (the panel no longer fetches
# them when a tab opens; a background poller does, on this interval)
CONF_REFRESH_MINUTES = "refresh_minutes"
# The panel's title bar hidden (the tabs stay)
CONF_HIDE_TOOLBAR = "hide_toolbar"
DEFAULT_REFRESH_MINUTES = 15
MIN_REFRESH_MINUTES = 1
MAX_REFRESH_MINUTES = 1440
DEFAULTS = {
    CONF_FILTER: "",
    CONF_INCLUDE_STARRED: False,
    CONF_IGNORE_ARCHIVED: False,
    CONF_NOTIFY_ISSUES: False,
    CONF_NOTIFY_PULLS: False,
    CONF_NOTIFY_RELEASES: False,
    CONF_REFRESH_MINUTES: DEFAULT_REFRESH_MINUTES,
    CONF_HIDE_TOOLBAR: False,
}
MAX_FILTER_LENGTH = 500

# Dispatcher signal sent after the background poller refreshes the items, so open panels update
SIGNAL_ITEMS_UPDATED = f"{DOMAIN}_items_updated"
