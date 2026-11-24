// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { safeUrl } from "./helpers.js";

// Counters of a repository: translation key, label key, icon, colour class.
export const REPO_STATS = [
  ["stargazers_count", "stars", ICONS.star, "star"],
  ["forks_count", "forks", ICONS.fork, "fork"],
  ["subscribers_count", "watchers", ICONS.eye, "watch"],
  ["issues_count", "issues", ICONS.issue, "issue"],
  ["pulls_count", "pulls", ICONS.pr, "pr"],
  ["merged_pulls_count", "merged_pulls", ICONS.merge, "merged"],
  ["discussions_count", "discussions", ICONS.forum, "disc"],
  ["latest_release_downloads", "downloads", ICONS.download, "dl"],
];

// Latest activity of a repository: translation key and icon (the label key is the translation key).
export const REPO_LATEST = [
  ["latest_release", ICONS.release],
  ["latest_tag", ICONS.tag],
  ["latest_commit", ICONS.commit],
  ["latest_pull_request", ICONS.pr],
  ["latest_issue", ICONS.issue],
  ["latest_discussion", ICONS.forum],
];

// Counters of the account (disabled by default in the integration).
export const USER_STATS = [
  ["followers", "followers", ICONS.group, "user"],
  ["following", "following", ICONS.account, "user"],
  ["public_repos", "public_repos", ICONS.code, "user"],
  ["public_gists", "public_gists", ICONS.code, "user"],
];

export const REPO_KEYS = new Set([...REPO_STATS.map(([k]) => k), ...REPO_LATEST.map(([k]) => k)]);
export const USER_KEYS = new Set(USER_STATS.map(([k]) => k));

// Without a translation key in the registry: the end of the English entity id, made from the English names.
export const ID_SUFFIXES = Object.entries({
  stargazers_count: "stars",
  forks_count: "forks",
  subscribers_count: "watchers",
  issues_count: "issues",
  pulls_count: "pull_requests",
  merged_pulls_count: "merged_pull_requests",
  discussions_count: "discussions",
  latest_release_downloads: "latest_release_downloads",
  latest_release: "latest_release",
  latest_tag: "latest_tag",
  latest_commit: "latest_commit",
  latest_issue: "latest_issue",
  latest_pull_request: "latest_pull_request",
  latest_discussion: "latest_discussion",
  followers: "followers",
  following: "following",
  public_repos: "public_repositories",
  public_gists: "public_gists",
}).sort((a, b) => b[1].length - a[1].length);

export const keyOf = (e) => {
  if (e.translation_key) return REPO_KEYS.has(e.translation_key) || USER_KEYS.has(e.translation_key) ? e.translation_key : null;
  return ID_SUFFIXES.find(([, sfx]) => e.entity_id.endsWith(`_${sfx}`))?.[0] || null;
};

export let discoveryCache = null;

/**
 * The repositories and accounts of the GitHub integration, from the entity registry: one group per device (a
 * repository's device is named after its full name, owner/repo; an account's after its login), each with its
 * sensors by translation key. Cached until the entity or device registry changes.
 */
export const discover = (hass) => {
  if (discoveryCache && discoveryCache.entities === hass.entities && discoveryCache.devices === hass.devices) return discoveryCache.result;
  const groups = { repos: new Map(), users: new Map() };
  for (const e of Object.values(hass.entities || {})) {
    if (e.platform !== "github" || !String(e.entity_id).startsWith("sensor.") || e.hidden) continue;
    const key = keyOf(e);
    if (!key) continue;
    const map = USER_KEYS.has(key) ? groups.users : groups.repos;
    const id = e.device_id || "github";
    if (!map.has(id)) {
      const dev = hass.devices?.[e.device_id];
      const name = dev?.name || "";
      map.set(id, {
        id,
        name,
        label: dev?.name_by_user || name || "GitHub",
        url: safeUrl(dev?.configuration_url) || (name ? `https://github.com/${name}` : ""),
        s: {},
      });
    }
    map.get(id).s[key] = e.entity_id;
  }
  const result = { repos: [...groups.repos.values()], users: [...groups.users.values()] };
  discoveryCache = { entities: hass.entities, devices: hass.devices, result };
  return result;
};

export const trackedIds = (gh) => [...gh.repos, ...gh.users].flatMap((g) => Object.values(g.s));

/** What a render depends on: the registries, the language, and the states of the GitHub sensors. */
export const renderSignature = (hass) => {
  const gh = discover(hass);
  return [hass.entities, hass.devices, hass.language, hass.locale, hass.themes?.darkMode, ...trackedIds(gh).map((id) => hass.states[id])];
};

export const sameSignature = (a, b) => !!a && a.length === b.length && a.every((v, i) => v === b[i]);

/** Selector finding the same focused element after a re-render, from its data-* attributes. */
export const focusSelector = (el) => {
  const d = el?.dataset;
  if (!d?.action && !d?.entity) return null;
  return ["action", "target", "entity"]
    .filter((k) => d[k] !== undefined)
    .map((k) => `[data-${k}="${String(d[k]).replace(/["\\]/g, "\\$&")}"]`)
    .join("");
};
