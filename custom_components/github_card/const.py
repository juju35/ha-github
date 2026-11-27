"""Constants for the GitHub Card integration."""

DOMAIN = "github_card"
VERSION = "2.20.0"

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
# The panel's top bar hidden (the tabs stay): for nobody, everyone or the users who are not administrators
CONF_HIDE_TOOLBAR = "hide_toolbar"
HIDE_TOOLBAR_OFF = "off"
HIDE_TOOLBAR_CHOICES = (HIDE_TOOLBAR_OFF, "all", "non_admin")
# Defaults of a repository created with the GitHub CLI (New repository tab), edited in Settings and overridable for
# each repository in the form: visibility, website template ({name}, {owner}), topics, and the usual protections
CONF_REPO_VISIBILITY = "repo_visibility"
CONF_REPO_HOMEPAGE = "repo_homepage"
CONF_REPO_TOPICS = "repo_topics"
# Protections, applied after the creation in this order
CONF_REPO_EMPTY_COMMIT = "repo_empty_commit"  # an empty first commit on main, so the branch exists
CONF_REPO_SQUASH_ONLY = "repo_squash_only"  # squash merges only (no merge commit, no rebase)
CONF_REPO_SQUASH_PR = "repo_squash_pr"  # squash commit = pull request title + description
CONF_REPO_DELETE_BRANCH = "repo_delete_branch"  # head branches deleted once merged
CONF_REPO_AUTO_MERGE = "repo_auto_merge"  # auto-merge allowed
CONF_REPO_NO_WIKI = "repo_no_wiki"  # no wiki and no projects
CONF_REPO_PROTECT_BRANCH = "repo_protect_branch"  # ruleset on the default branch
CONF_REPO_PROTECT_TAGS = "repo_protect_tags"  # ruleset on the v* tags
CONF_REPO_RULESETS_FROM = "repo_rulesets_from"  # owner/repo whose rulesets are copied instead of the two above
REPO_PROTECTIONS = (
    CONF_REPO_EMPTY_COMMIT,
    CONF_REPO_SQUASH_ONLY,
    CONF_REPO_SQUASH_PR,
    CONF_REPO_DELETE_BRANCH,
    CONF_REPO_AUTO_MERGE,
    CONF_REPO_NO_WIKI,
    CONF_REPO_PROTECT_BRANCH,
    CONF_REPO_PROTECT_TAGS,
)
REPO_DEFAULTS = {
    CONF_REPO_VISIBILITY: "public",
    CONF_REPO_HOMEPAGE: "",
    CONF_REPO_TOPICS: "",
    CONF_REPO_EMPTY_COMMIT: True,
    CONF_REPO_SQUASH_ONLY: True,
    CONF_REPO_SQUASH_PR: True,
    CONF_REPO_DELETE_BRANCH: True,
    CONF_REPO_AUTO_MERGE: False,
    CONF_REPO_NO_WIKI: True,
    CONF_REPO_PROTECT_BRANCH: True,
    CONF_REPO_PROTECT_TAGS: True,
    CONF_REPO_RULESETS_FROM: "",
}
# Branches tab: the branches whose last commit is older than this many days (0: every branch but the default one)
CONF_BRANCH_AGE_DAYS = "branch_age_days"
DEFAULT_BRANCH_AGE_DAYS = 1
MAX_BRANCH_AGE_DAYS = 3650
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
    CONF_HIDE_TOOLBAR: HIDE_TOOLBAR_OFF,
    CONF_BRANCH_AGE_DAYS: DEFAULT_BRANCH_AGE_DAYS,
    **REPO_DEFAULTS,
}
MAX_FILTER_LENGTH = 500

# Dispatcher signal sent after the background poller refreshes the items, so open panels update
SIGNAL_ITEMS_UPDATED = f"{DOMAIN}_items_updated"
