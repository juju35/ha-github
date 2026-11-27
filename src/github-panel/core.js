/*
 * GitHub panel for Home Assistant (administrators only)
 * https://github.com/juju35/ha-github
 *
 * Seven tabs under the toolbar, as in Smart Comfort and IPTV (text tabs, the active one underlined, the tab in the
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
 * - Branches: the branches of your own repositories (the default ones left out) whose last commit is older than
 *   the age set in Settings, with their open pull request; tick some and delete them (github_card/branches,
 *   github_card/delete_branches);
 * - New repository: shown only when the GitHub CLI (gh) is installed on the Home Assistant host and signed in
 *   (github_card/gh_status); creates a repository with gh — name, owner, description, website, topics, visibility
 *   (github_card/create_repo);
 * - Settings: which repositories are offered (name patterns, starred ones, archived ones ignored), the new issue / pull request
 *   notifications, and the title bar hidden (the tabs and the menu button stay).
 */

export const GITHUB_PANEL_VERSION = "2.20.2";
// No Activity tab since 2.3.0: the Repositories tab shows the same; /github-config/activity opens Repositories.
export const GITHUB_PANEL_TABS = ["repos", "issues", "pulls", "mine", "branches", "create", "settings"];
// Upper bound of the minimum age of the Branches tab, in days (kept in step with const.py)
export const GITHUB_PANEL_MAX_BRANCH_AGE = 3650;
// Topics of a new repository: at most this many (kept in step with gh_cli.py)
export const GITHUB_PANEL_MAX_TOPICS = 20;
// Protections of a new repository, in the order they are applied (kept in step with REPO_PROTECTIONS of const.py),
// and their defaults when the settings are not loaded yet
export const GITHUB_PANEL_PROTECTIONS = [
  "repo_empty_commit", "repo_squash_only", "repo_squash_pr", "repo_delete_branch", "repo_auto_merge", "repo_no_wiki",
  "repo_protect_branch", "repo_protect_tags",
];
export const GITHUB_PANEL_PROTECTION_DEFAULTS = {
  repo_empty_commit: true, repo_squash_only: true, repo_squash_pr: true, repo_delete_branch: true, repo_auto_merge: false,
  repo_no_wiki: true, repo_protect_branch: true, repo_protect_tags: true,
};
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
  // New repository tab (GitHub CLI): the form, its result and its errors
  "create", "c_name", "c_owner", "c_owner_hint", "c_description", "c_topics", "c_topics_hint", "c_visibility", "c_public", "c_private",
  "c_submit", "c_creating", "c_created", "c_gh_ready",
  "c_err_invalid_name", "c_err_invalid_owner", "c_err_invalid_description", "c_err_invalid_topics", "c_err_invalid_visibility",
  "c_err_gh_missing", "c_err_gh_not_authenticated", "c_err_gh_failed",
  // New repository: its website (gh repo create --homepage)
  "c_homepage", "c_homepage_hint", "c_err_invalid_homepage",
  // New repository: its protections (this repository in the tab, the defaults in Settings) and the steps that failed
  "s_group_new_repo", "s_new_repo_hint", "c_homepage_template_hint", "c_topics_default_hint", "c_protections", "c_defaults_hint",
  "p_empty_commit", "p_empty_commit_hint", "p_squash_only", "p_squash_pr", "p_delete_branch", "p_auto_merge", "p_no_wiki",
  "p_protect_branch", "p_protect_branch_hint", "p_protect_tags", "p_protect_tags_hint", "p_rulesets_from", "p_rulesets_from_hint",
  "c_steps_failed", "c_step_failed", "step_empty_commit", "step_merge", "step_topics", "step_rulesets", "c_err_invalid_rulesets_from",
  // Branches tab, and its minimum age in Settings
  "branches", "b_summary", "b_repos", "b_none", "b_select_all", "b_delete", "b_confirm", "b_deleted", "b_failed", "b_open_pr", "b_days",
  "b_default_branch", "b_invalid", "s_group_branches", "s_branch_age", "s_branch_age_hint",
  // Settings: the GitHub CLI on the Home Assistant host
  "s_group_gh", "s_gh_ok", "s_gh_missing", "s_gh_signed_out", "s_gh_hint",
];
