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
