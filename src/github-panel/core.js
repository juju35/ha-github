/*
 * GitHub panel for Home Assistant (administrators only)
 * https://github.com/juju35/ha-github
 *
 * Five tabs under the toolbar, as in Smart Comfort and IPTV (text tabs, the active one underlined, the tab in the
 * address, Settings last):
 * - Repositories: the repositories of your GitHub account (and your starred ones, if chosen), followed or not by the
 *   core GitHub integration; follow or stop following one, the ticked ones or all of them at once (one reload of the GitHub
 *   integration for the whole change), through the github_card/* WebSocket commands. Each followed repository shows
 *   its live counters and unfolds the GitHub Card's details; the head gives the totals (stars, open issues and pull
 *   requests), the GitHub account (followers…) closes the list;
 * - Issues and Pull requests: the open ones of the followed repositories, most recently updated first, from the
 *   GitHub API (github_card/items, cached 5 minutes by the integration; Refresh asks GitHub again);
 * - My pull requests: the open pull requests you authored, in any repository (not only the followed ones), from a
 *   GitHub search (github_card/mine, cached 5 minutes; loaded when the tab opens, Refresh asks GitHub again);
 * - Settings: which repositories are offered (name patterns, starred ones, archived ones ignored), the new issue / pull request
 *   notifications, and the title bar hidden (the tabs and the menu button stay).
 */

export const GITHUB_PANEL_VERSION = "2.18.3";
// No Activity tab since 2.3.0: the Repositories tab shows the same; /github-config/activity opens Repositories.
export const GITHUB_PANEL_TABS = ["repos", "issues", "pulls", "mine", "settings"];
// Bounds of the items refresh interval, in minutes (kept in step with const.py)
export const GITHUB_PANEL_MIN_REFRESH = 1;
export const GITHUB_PANEL_MAX_REFRESH = 1440;
// Orders of the Repositories tab (see GitHubPanel._rows)
export const GITHUB_PANEL_SORTS = ["followed", "name", "stars", "issues", "pulls"];

// Translations: one list per language, in the order of KEYS (the tests check the parity).
export const GITHUB_PANEL_KEYS = [
  "title", "repos", "activity", "settings", "open_integration", "loading",
  "no_github", "add_github", "not_loaded", "offered_error",
  "summary", "search", "follow_all", "follow", "unfollow", "followed", "confirm_unfollow", "cancel",
  "working", "done", "skipped", "error", "empty", "open_github",
  "s_filter", "s_filter_hint", "s_starred", "s_starred_hint", "s_archived", "s_archived_hint", "s_notify_issues", "s_notify_pulls", "s_notify_releases", "s_notify_hint",
  "save", "saved",
  // Issues and Pull requests tabs
  "issues", "pulls", "refresh", "no_issues", "no_pulls", "no_followed", "items_error",
  "draft", "approved", "changes_requested", "review_required", "by", "updated", "comments", "all_repos", "open_n",
  // Rows of the followed repositories
  "stars", "release", "details",
  // Order of the Repositories tab
  "sort_label", "sort_followed", "sort_name", "sort_stars", "sort_issues", "sort_pulls",
  // A failed load, tried again at once
  "retry",
  // Several repositories followed at once
  "follow_selected", "select_repo",
  // Refresh interval of the Issues and Pull requests
  "s_refresh", "s_refresh_hint",
  // My pull requests tab (open pull requests I authored, in any repository) and the checks state of a pull request
  "mine", "no_mine", "checks_passing", "checks_failing", "checks_pending",
  // Downloads of the followed repositories: a row counter and the page total
  "downloads", "total_downloads",
  // The panel's title bar hidden (the tabs stay)
  "s_hide_toolbar", "s_hide_toolbar_hint",
  // The cards' charter: list titles, the Settings header's pill, the Settings groups, the other refresh interval
  "followed_head", "to_follow", "unsaved", "up_to_date", "s_group_notify", "s_group_refresh", "s_group_panel", "s_patterns", "other",
  // The ENT ONE layout: the Repositories "To handle" card and the repository filter's overflow
  "to_handle", "nothing_to_handle", "more_repos",
  // The top bar hidden for nobody, everyone or the users who are not administrators
  "hide_off", "hide_all", "hide_non_admin",
  // The unfolded repository and the account, drawn by the panel: counters, latest activity, account (the card's words)
  "d_stars", "d_forks", "d_watchers", "d_issues", "d_pulls", "d_merged_pulls", "d_discussions", "d_downloads", "d_latest_release", "d_latest_tag", "d_latest_commit", "d_latest_issue", "d_latest_pull_request", "d_latest_discussion", "d_account", "d_followers", "d_following", "d_public_repos", "d_public_gists",
  // Issues and Pull requests: the links of the listed items copied to the clipboard
  "copy_links", "links_copied",
];
