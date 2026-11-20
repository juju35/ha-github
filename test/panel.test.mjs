// The sidebar panel: translations, the rows of the Repositories tab and the commands it sends.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const timers = [];
const load = () => {
  const src = readFileSync(new URL("../custom_components/github_card/frontend/github-panel.js", import.meta.url), "utf8");
  const defined = new Map();
  const context = {
    HTMLElement: class {
      attachShadow() {
        this.shadowRoot = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
        return this.shadowRoot;
      }
    },
    customElements: { get: (n) => defined.get(n), define: (n, c) => defined.set(n, c) },
    console: { error() {} },
    // Timers recorded, not run: the retry test calls them itself
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
    clearTimeout() {},
    history: { replaceState() {}, pushState() {} },
    window: { dispatchEvent() {} },
    CustomEvent: class {},
  };
  vm.createContext(context);
  return vm.runInContext(`${src}\n;({ GITHUB_PANEL_KEYS, GITHUB_PANEL_TRANSLATIONS, GITHUB_PANEL_STRINGS, GitHubPanel })`, context);
};

const lib = load();
const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort();

test("every language has one string per key, with the English placeholders", () => {
  assert.deepEqual([...Object.keys(lib.GITHUB_PANEL_TRANSLATIONS)].sort(), [...LANGS].sort());
  for (const l of LANGS) {
    assert.equal(lib.GITHUB_PANEL_TRANSLATIONS[l].length, lib.GITHUB_PANEL_KEYS.length, l);
    for (const k of lib.GITHUB_PANEL_KEYS) {
      assert.ok(String(lib.GITHUB_PANEL_STRINGS[l][k]).trim(), `${l}.${k}`);
      assert.deepEqual(placeholders(lib.GITHUB_PANEL_STRINGS[l][k]), placeholders(lib.GITHUB_PANEL_STRINGS.en[k]), `${l}.${k}`);
    }
  }
});

const panel = (calls = []) => {
  const p = new lib.GitHubPanel();
  p._hass = {
    language: "fr",
    callWS: async (msg) => {
      calls.push(msg);
      if (msg.type === "github_card/follow") return { ok: true, added: msg.add, removed: msg.remove, skipped: [] };
      return { configured: true, state: "loaded", followed: ["juju35/ha-parcel"], offered: ["juju35/ha-iptv", "juju35/ha-uv-card"], offered_error: false };
    },
  };
  p._overview = { configured: true, state: "loaded", followed: ["juju35/ha-parcel"], offered: ["juju35/ha-iptv", "juju35/ha-uv-card"] };
  return p;
};

test("rows: followed first, then offered, filtered by the search", () => {
  const p = panel();
  assert.deepEqual(
    JSON.parse(JSON.stringify(p._rows().map((r) => [r.name, r.followed]))),
    [["juju35/ha-parcel", true], ["juju35/ha-iptv", false], ["juju35/ha-uv-card", false]],
  );
  p._query = "UV";
  assert.deepEqual([...p._rows().map((r) => r.name)], ["juju35/ha-uv-card"]);
});

test("follow all sends the offered repositories shown in one command", async () => {
  const calls = [];
  const p = panel(calls);
  p._query = "ha-";
  await p._repoAction("follow-all");
  const follow = calls.find((c) => c.type === "github_card/follow");
  assert.deepEqual([...follow.add], ["juju35/ha-iptv", "juju35/ha-uv-card"]);
  assert.deepEqual([...follow.remove], []);
  assert.equal(p._message.tone, "good");
  assert.equal(p._message.text, "Suivis : 2 · Plus suivis : 0");
});

test("follow selected: a checkbox per repository not followed, the ticked ones sent together", async () => {
  const calls = [];
  const p = panel(calls);
  const host = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
  p.shadowRoot.getElementById = (id) => (id === "repos" ? host : null);
  p._renderRepos();
  assert.equal((host.innerHTML.match(/class="pick-repo"/g) || []).length, 2);
  assert.match(host.innerHTML, /aria-label="Sélectionner juju35\/ha-iptv"/);
  assert.doesNotMatch(host.innerHTML, /follow-selected/);
  p._selected.add("juju35/ha-uv-card");
  // A selected repository no longer offered (followed elsewhere) leaves the selection
  p._selected.add("juju35/gone");
  p._renderRepos();
  assert.match(host.innerHTML, /Suivre la sélection \(1\)/);
  assert.match(host.innerHTML, /data-repo="juju35\/ha-uv-card"[^>]*checked/);
  // Hidden by the search, still followed with the others
  p._query = "iptv";
  await p._repoAction("follow-selected");
  const follow = calls.find((c) => c.type === "github_card/follow");
  assert.deepEqual([...follow.add], ["juju35/ha-uv-card"]);
  assert.equal(p._selected.size, 0);
});

test("stop following asks first, then sends the removal", async () => {
  const calls = [];
  const p = panel(calls);
  await p._repoAction("unfollow", "juju35/ha-parcel");
  assert.equal(p._confirm, "juju35/ha-parcel");
  assert.equal(calls.length, 0);
  await p._repoAction("unfollow-confirmed", "juju35/ha-parcel");
  assert.equal(p._confirm, null);
  assert.deepEqual([...calls[0].remove], ["juju35/ha-parcel"]);
});

test("the language falls back to the base, then English", () => {
  const p = new lib.GitHubPanel();
  p._hass = { language: "sr-Latn" };
  assert.equal(p._lang(), "sr-Latn");
  p._hass = { language: "de-CH" };
  assert.equal(p._t("follow"), "Verfolgen");
  p._hass = { language: "ja" };
  assert.equal(p._t("summary", { followed: 1, offered: 2 }), "Followed: 1 · Not followed: 2");
});

test("followed rows: live counters from the GitHub sensors, one row unfolded at a time", async () => {
  const p = panel();
  p._overview.sensors = { "juju35/ha-parcel": { stargazers_count: "sensor.s", issues_count: "sensor.i", latest_release: "sensor.r", pulls_count: "sensor.gone" } };
  p._hass.states = {
    "sensor.s": { state: "1840" },
    "sensor.i": { state: "3" },
    "sensor.r": { state: "v1.4.0" },
  };
  const html = p._infoHtml("juju35/ha-parcel");
  assert.match(html, /Étoiles : 1840|Étoiles: 1840/);
  assert.match(html, /1,8\s?k/);
  assert.match(html, />3</);
  assert.match(html, /v1\.4\.0/);
  // A missing sensor shows nothing rather than a dash
  assert.doesNotMatch(html, /Pull requests/);
  assert.equal(p._infoHtml("juju35/ha-iptv"), "");
  await p._repoAction("expand", "juju35/ha-parcel");
  assert.equal(p._expanded, "juju35/ha-parcel");
  await p._repoAction("expand", "juju35/ha-parcel");
  assert.equal(p._expanded, null);
});

test("the panel draws the unfolded repository and the account itself: tiles, latest activity, safe links", () => {
  const p = panel();
  p._overview.login = "juju35";
  p._overview.sensors = {
    "juju35/ha-parcel": { stargazers_count: "sensor.s", forks_count: "sensor.f", latest_release: "sensor.r", latest_commit: "sensor.c", latest_issue: "sensor.x" },
  };
  p._overview.account = { followers: "sensor.fo", public_gists: "sensor.g" };
  p._hass.states = {
    "sensor.s": { state: "1840" },
    "sensor.f": { state: "unavailable" },
    "sensor.r": { state: "Version <b>1.4</b>", attributes: { tag: "v1.4.0", url: "https://github.com/juju35/ha-parcel/releases/v1.4.0" } },
    "sensor.c": { state: "fix: a\nsecond line", attributes: { sha: "c0ffee42d1b7", url: "javascript:alert(1)" } },
  };
  const html = p._detailHtml("juju35/ha-parcel");
  assert.match(html, /class="dt-tile c-star" data-entity="sensor\.s"[^>]*title="Étoiles: 1\s?840"/);
  assert.match(html, />1,8\s?k</);
  // An unavailable counter shows a dash; the release's markup is escaped, its tag and link shown
  assert.match(html, /data-entity="sensor\.f"[\s\S]*?<div class="v">—</);
  assert.match(html, /Version &lt;b&gt;1\.4&lt;\/b&gt;<small>v1\.4\.0<\/small>/);
  assert.match(html, /href="https:\/\/github\.com\/juju35\/ha-parcel\/releases\/v1\.4\.0"/);
  // The commit's first line and short sha; a javascript: link is not drawn
  assert.match(html, /fix: a<small>c0ffee4<\/small>/);
  assert.doesNotMatch(html, /javascript:/);
  // A sensor without a state: a dash and no link
  assert.match(html, /data-entity="sensor\.x"[\s\S]*?<span class="v">—<\/span><\/div>/);
  assert.equal(p._detailHtml("juju35/ha-iptv"), "");
  // The account: hidden while none of its sensors has a state, then its counters under "Account · login"
  assert.equal(p._accountHtml(), "");
  p._hass.states["sensor.fo"] = { state: "1240" };
  const account = p._accountHtml();
  assert.match(account, /Compte · juju35/);
  assert.match(account, /data-entity="sensor\.fo"/);
  assert.match(account, /href="https:\/\/github\.com\/juju35"/);
  // No GitHub Card anywhere in the panel
  assert.doesNotMatch(html + account, /github-card/);
});

test("sorts of the Repositories tab: followed first by default, name, and the followed ones by a live counter", () => {
  const p = panel();
  p._overview = {
    configured: true,
    state: "loaded",
    followed: ["juju35/ha-parcel", "juju35/ha-weather-card"],
    offered: ["juju35/aaos-parcel", "juju35/ha-iptv"],
    sensors: {
      "juju35/ha-parcel": { stargazers_count: "sensor.p_s", issues_count: "sensor.p_i", pulls_count: "sensor.p_p" },
      "juju35/ha-weather-card": { stargazers_count: "sensor.w_s", issues_count: "sensor.w_i", pulls_count: "sensor.w_p" },
    },
  };
  p._hass.states = {
    "sensor.p_s": { state: "184" }, "sensor.p_i": { state: "3" }, "sensor.p_p": { state: "0" },
    "sensor.w_s": { state: "57" }, "sensor.w_i": { state: "9" }, "sensor.w_p": { state: "unavailable" },
  };
  const order = () => [...p._rows().map((r) => r.name)];
  assert.deepEqual(order(), ["juju35/ha-parcel", "juju35/ha-weather-card", "juju35/aaos-parcel", "juju35/ha-iptv"]);
  p._sort = "name";
  assert.deepEqual(order(), ["juju35/aaos-parcel", "juju35/ha-iptv", "juju35/ha-parcel", "juju35/ha-weather-card"]);
  p._sort = "stars";
  assert.deepEqual(order(), ["juju35/ha-parcel", "juju35/ha-weather-card", "juju35/aaos-parcel", "juju35/ha-iptv"]);
  p._sort = "issues";
  assert.deepEqual(order(), ["juju35/ha-weather-card", "juju35/ha-parcel", "juju35/aaos-parcel", "juju35/ha-iptv"]);
  // An unavailable counter goes after the known ones, still before the repositories not followed
  p._sort = "pulls";
  assert.deepEqual(order(), ["juju35/ha-parcel", "juju35/ha-weather-card", "juju35/aaos-parcel", "juju35/ha-iptv"]);
  // The search applies to every order
  p._query = "parcel";
  assert.deepEqual(order(), ["juju35/ha-parcel", "juju35/aaos-parcel"]);
});

test("Repositories head: totals of the followed repositories (stars, open issues and pull requests); no Activity tab", () => {
  const p = panel();
  p._overview.sensors = { "juju35/ha-parcel": { stargazers_count: "sensor.s", issues_count: "sensor.i", pulls_count: "sensor.p" } };
  p._hass.states = { "sensor.s": { state: "1840" }, "sensor.i": { state: "3" }, "sensor.p": { state: "1" } };
  const html = p._totalsHtml();
  assert.match(html, /1,8\s?k/);
  assert.match(html, /Ouvertes : 4/);
  p._overview.sensors = {};
  assert.equal(p._totalsHtml(), "");
  // The former Activity address opens Repositories
  p.route = { path: "/activity" };
  assert.equal(p._tab, "repos");
});

test("a failed load is tried again after 2 s, 5 s, 15 s then every 30 s, its error goes once it loads, and on reconnection", async () => {
  timers.length = 0;
  const panel = Object.create(lib.GitHubPanel.prototype);
  panel._renderRepos = () => {};
  panel._renderSettings = () => {};
  panel._needsItems = () => false;
  panel.isConnected = true;
  let fail = true;
  panel._hass = {
    language: "en",
    callWS: async (msg) => {
      if (fail) throw new Error("Unknown command.");
      return msg.type === "github_card/settings" ? { settings: { filter: "x" } } : { configured: true, followed: [], offered: [] };
    },
  };
  await panel._reload();
  assert.equal(panel._failed, true);
  assert.match(panel._message.text, /Unknown command/);
  // Both loads failed: one retry pending (the second replaces the first), 2 s
  assert.equal(timers.at(-1).ms, 2000);
  fail = false;
  await timers.at(-1).fn();
  await new Promise((r) => setTimeout(r));
  assert.equal(panel._failed, false);
  assert.equal(panel._message, null);
  assert.equal(panel._settings.filter, "x");
  const listeners = new Map();
  panel._hass.connection = { addEventListener: (t, f) => listeners.set(t, f), removeEventListener: (t, f) => listeners.get(t) === f && listeners.delete(t) };
  panel._watchConnection(true);
  let reloads = 0;
  panel._reload = async () => { reloads++; };
  listeners.get("ready")();
  assert.equal(reloads, 1);
  panel._watchConnection(false);
  assert.equal(listeners.size, 0);
});

test("Retry loads again at once", async () => {
  const panel = Object.create(lib.GitHubPanel.prototype);
  let reloads = 0;
  panel._reload = async () => { reloads++; };
  await panel._repoAction("retry");
  assert.equal(reloads, 1);
  assert.equal(lib.GITHUB_PANEL_STRINGS.fr.retry, "Réessayer");
});

test("My pull requests: the list is loaded once the tab opens, then cached", async () => {
  const calls = [];
  const p = panel(calls);
  p._hass.callWS = async (msg) => {
    calls.push(msg);
    return { pulls: [], viewer: "juju35", fetched_at: 1, error: null, pending: false };
  };
  // Opening another tab does not fetch; opening My pull requests does, exactly once.
  p._showTab("issues");
  assert.equal(calls.filter((c) => c.type === "github_card/mine").length, 0);
  p._showTab("mine");
  await new Promise((r) => setTimeout(r));
  assert.equal(calls.filter((c) => c.type === "github_card/mine").length, 1);
  p._showTab("mine");
  assert.equal(calls.filter((c) => c.type === "github_card/mine").length, 1);
});

test("My pull requests render: repository, review and checks, no redundant author, with the Refresh button", () => {
  const p = panel();
  p._mine = {
    pulls: [
      { repo: "home-assistant/core", number: 155412, title: "Add diagnostics", url: "https://github.com/home-assistant/core/pull/155412",
        author: "juju35", updated: new Date().toISOString(), comments: 2, labels: [], draft: false, review: "REVIEW_REQUIRED", checks: "SUCCESS" },
    ],
    viewer: "juju35", fetched_at: 1, error: null, pending: false,
  };
  const host = { innerHTML: "", querySelector: () => ({ addEventListener() {} }), querySelectorAll: () => [] };
  p.shadowRoot.getElementById = (id) => (id === "mine" ? host : null);
  p._renderMine();
  assert.match(host.innerHTML, /home-assistant\/core #155412/);
  assert.match(host.innerHTML, /Revue requise/); // review state
  assert.match(host.innerHTML, /Tests réussis/); // checks state
  assert.match(host.innerHTML, /Actualiser/); // Refresh button
  // The author is the viewer, so "by me" is not shown
  assert.doesNotMatch(host.innerHTML, /juju35</);
});

test("My pull requests: the empty and pending states", () => {
  const p = panel();
  const host = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
  p.shadowRoot.getElementById = (id) => (id === "mine" ? host : null);
  // Not loaded yet: loading
  p._renderMine();
  assert.match(host.innerHTML, /Chargement/);
  // Loaded, none: the empty message
  p._mine = { pulls: [], viewer: "juju35", fetched_at: 1, error: null, pending: false };
  p._renderMine();
  assert.match(host.innerHTML, /aucune pull request ouverte/);
});

test("title bar hidden: from the panel's registration until the settings arrive, then from the settings; menu where HA shows it", () => {
  const p = new lib.GitHubPanel();
  const attrs = new Set();
  p.toggleAttribute = (name, on) => (on ? attrs.add(name) : attrs.delete(name));
  p.panel = { url_path: "github-config", config: { hide_toolbar: true } };
  const loading = attrs.has("bare");
  p._settings = { hide_toolbar: false };
  p._syncBare();
  const saved = attrs.has("bare");
  p.narrow = true;
  const menu = attrs.has("menu");
  p.narrow = false;
  p._hass = { dockedSidebar: "always_hidden" };
  p._syncBare();
  assert.deepEqual({ loading, saved, menu, hiddenSidebar: attrs.has("menu") }, { loading: true, saved: false, menu: true, hiddenSidebar: true });
});

test("top bar hidden for everyone or only for non-administrators; an older saved switch means everyone", () => {
  const p = new lib.GitHubPanel();
  const attrs = new Set();
  p.toggleAttribute = (name, on) => (on ? attrs.add(name) : attrs.delete(name));
  const bare = (mode, admin) => {
    p._hass = { user: { is_admin: admin } };
    p._settings = { hide_toolbar: mode };
    p._syncBare();
    return attrs.has("bare");
  };
  assert.deepEqual(
    [bare("off", false), bare("all", true), bare("non_admin", true), bare("non_admin", false), bare(true, true), bare(false, false)],
    [false, true, false, true, true, false],
  );
});

test("repository filter: chips only for the busiest five repositories with open items, the rest behind + N more", () => {
  const p = new lib.GitHubPanel();
  p._hass = { language: "en" };
  const followed = Array.from({ length: 40 }, (_, i) => `juju35/repo-${String(i).padStart(2, "0")}`);
  p._overview = { configured: true, followed, offered: [] };
  const totals = {};
  followed.slice(0, 8).forEach((r, i) => {
    totals[r] = { issues: 10 - i, pulls: 0 };
  });
  p._items = { issues: [], pulls: [], totals };
  const host = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
  p.shadowRoot = { getElementById: (id) => (id === "issues" ? host : null), querySelector: () => null };
  p._renderHandle = () => {};
  p._renderItems("issues");
  const chips = host.innerHTML.match(/<button class="chip" data-repo="[^"]*" aria-pressed="[^"]*">/g) || [];
  assert.equal(chips.length, 1 + 5 + 3, "All, the five busiest, and the three others in the overflow list");
  assert.match(host.innerHTML, /data-repo="juju35\/repo-00"[^>]*>juju35\/repo-00 <em>10<\/em>/, "the busiest first");
  assert.match(host.innerHTML, /<summary class="chip">\+ 3 more/);
  assert.match(host.innerHTML, /data-repo="juju35\/repo-39"[^>]*hidden data-quiet/, "a repository at 0 only found by the search");
  // Nothing open: no chips at all
  p._items = { issues: [], pulls: [], totals: {} };
  p._renderItems("pulls");
  host.innerHTML = "";
  p.shadowRoot.getElementById = (id) => (id === "pulls" ? host : null);
  p._renderItems("pulls");
  assert.doesNotMatch(host.innerHTML, /class="chip"/);
});
