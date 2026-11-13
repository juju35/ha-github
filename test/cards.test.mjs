import assert from "node:assert/strict";
import { test } from "node:test";
import { accountOnly, hass } from "../scripts/mock-states.mjs";
import { load, render } from "./load.mjs";

const lib = load();
const names = (html) => [...html.matchAll(/class="repo-name" title="([^"]+)"/g)].map((m) => m[1]);

test("full card: every repository, folded and sorted by name, then the account", () => {
  const { html } = render(lib.GitHubCard, {}, hass());
  assert.deepEqual(names(html), ["home-assistant/core", "juju35/ha-parcel", "juju35/ha-weather-card"]);
  assert.equal((html.match(/repo-head toggle closed/g) || []).length, 3);
  assert.match(html, /Account · octocat/);
  assert.match(html, /Repositories: 3/);
  // 2614 + 642 + 3 + 1 open issues and pull requests.
  assert.match(html, /Open: 3,260/);
});

test("a click on a repository unfolds it, a second click folds it", () => {
  const { card } = render(lib.GitHubCard, {}, hass());
  card._action("repo", "dev_parcel");
  let html = card.shadowRoot.innerHTML;
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Latest release/);
  assert.match(html, /v1\.4\.0/);
  assert.match(html, /#97/);
  assert.match(html, /a81d0c9/);
  card._action("repo", "dev_parcel");
  html = card.shadowRoot.innerHTML;
  assert.doesNotMatch(html, /aria-expanded="true"/);
});

test("repositories: only those listed, in their order, and a single one always unfolded", () => {
  let { html } = render(lib.GitHubCard, { repositories: ["JUJU35/ha-weather-card", "home-assistant/core"] }, hass());
  assert.deepEqual(names(html), ["juju35/ha-weather-card", "home-assistant/core"]);
  ({ html } = render(lib.GitHubCard, { repositories: ["juju35/ha-parcel"] }, hass()));
  assert.doesNotMatch(html, /repo-head toggle/);
  assert.match(html, /Latest commit/);
  ({ html } = render(lib.GitHubCard, { repositories: ["juju35/ha-parcel"], show_latest: false }, hass()));
  assert.doesNotMatch(html, /Latest commit/);
});

test("sort: by stars and by open issues and pull requests", () => {
  const h = hass({ "sensor.juju35_ha_weather_card_issues_count": { entity_id: "sensor.juju35_ha_weather_card_issues_count", state: "9", attributes: {} } });
  assert.deepEqual(names(render(lib.GitHubCard, { sort: "stars" }, h).html), ["home-assistant/core", "juju35/ha-parcel", "juju35/ha-weather-card"]);
  assert.deepEqual(names(render(lib.GitHubCard, { sort: "open", repositories: ["juju35/ha-parcel", "juju35/ha-weather-card"] }, h).html), ["juju35/ha-weather-card", "juju35/ha-parcel"]);
});

test("nothing open, unknown counters, and no GitHub entity", () => {
  assert.match(render(lib.GitHubCard, { repositories: ["juju35/ha-weather-card"] }, hass()).html, /Nothing open/);
  const off = { entity_id: "x", state: "unavailable", attributes: {} };
  const h = hass({ "sensor.juju35_ha_weather_card_issues_count": off, "sensor.juju35_ha_weather_card_pulls_count": off });
  assert.match(render(lib.GitHubCard, { repositories: ["juju35/ha-weather-card"] }, h).html, /class="chip muted"/);
  assert.match(render(lib.GitHubCard, {}, { states: {}, entities: {}, devices: {} }).html, /No GitHub entities found/);
});

test("latest activity: only web links, values escaped", () => {
  const id = "sensor.juju35_ha_parcel_latest_issue";
  const h = hass({ [id]: { entity_id: id, state: "<b>x</b>", attributes: { number: 5, url: "javascript:alert(1)" } } });
  const { card } = render(lib.GitHubCard, { repositories: ["juju35/ha-parcel"] }, h);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.doesNotMatch(html, /javascript:/);
});

test("mini card: totals, one line per repository up to max_repos, then +N", () => {
  const { html } = render(lib.GitHubMiniCard, { max_repos: 2 }, hass());
  assert.match(html, /Stars: 78,653/);
  assert.equal((html.match(/class="item clickable"/g) || []).length, 2);
  assert.match(html, />\+1</);
  assert.match(html, /data-action="zoom"/);
  assert.doesNotMatch(render(lib.GitHubMiniCard, { zoom: false }, hass()).html, /data-action="zoom"/);
});

test("mini card: a repository line shows the full card on it, the zoom button goes back", () => {
  const { card } = render(lib.GitHubMiniCard, {}, hass());
  card._action("show", "dev_weather", { stopPropagation() {} });
  let html = card.shadowRoot.innerHTML;
  assert.match(html, /repo-head toggle" data-action="repo" data-target="dev_weather"/);
  assert.match(html, /Back to the compact view/);
  card._action("zoom", null, { stopPropagation() {}, detail: 1 });
  html = card.shadowRoot.innerHTML;
  assert.match(html, /Show the full card/);
  assert.doesNotMatch(html, /repo-head/);
});

test("folding: a tap elsewhere (pointer), not a drag that ends outside; leaving the page folds back too", () => {
  const { card } = render(lib.GitHubCard, {}, hass());
  card.connectedCallback();
  card._action("repo", "dev_weather", { stopPropagation() {} });
  assert.equal(card._openRepo, "dev_weather");
  // A press in the card released outside of it: nothing folds.
  card._outside.tap({ composedPath: () => [card] });
  assert.equal(card._openRepo, "dev_weather");
  // A tap on a spot that sends no click (iOS): the pointer alone folds.
  card._outside.tap({ composedPath: () => [] });
  assert.equal(card._openRepo, null);
  // Left with a repository open and back: folded.
  card._action("repo", "dev_weather", { stopPropagation() {} });
  card.disconnectedCallback();
  card.connectedCallback();
  assert.equal(card._openRepo, null);
  card.disconnectedCallback();
  const mini = render(lib.GitHubMiniCard, {}, hass()).card;
  mini.connectedCallback();
  mini._action("show", "dev_weather", { stopPropagation() {} });
  assert.match(mini.shadowRoot.innerHTML, /Back to the compact view/);
  mini.disconnectedCallback();
  mini.connectedCallback();
  assert.match(mini.shadowRoot.innerHTML, /Show the full card/, "back compact");
  mini.disconnectedCallback();
});

test("the French card uses French labels and number formats", () => {
  const h = { ...hass(), language: "fr", locale: { language: "fr" } };
  const { html } = render(lib.GitHubMiniCard, {}, h);
  assert.match(html, /Dépôts : 3/);
  assert.match(html, /Étoiles/);
});

test("no repository followed: a message and a button to the GitHub integration, the account still shown", () => {
  const h = { ...hass(), entities: accountOnly };
  for (const Cls of [lib.GitHubCard, lib.GitHubMiniCard]) {
    const { html } = render(Cls, {}, h);
    assert.match(html, /No repository followed/);
    assert.match(html, /Add your repositories to the GitHub integration/);
    assert.match(html, /data-action="integration"/);
    assert.doesNotMatch(html, /Repositories: 0/);
    assert.doesNotMatch(html, /Unknown/);
    assert.doesNotMatch(html, /class="chip /);
  }
  assert.match(render(lib.GitHubCard, {}, h).html, /Account · octocat/);
});

test("repositories that the integration does not follow: the message says so", () => {
  const { html } = render(lib.GitHubCard, { repositories: ["juju35/nope"] }, hass());
  assert.match(html, /None of the repositories of the card is followed by the GitHub integration/);
  assert.doesNotMatch(html, /class="chip /);
});

test("the button opens the GitHub integration page", () => {
  const { card } = render(lib.GitHubCard, {}, { ...hass(), entities: accountOnly });
  const pushed = [];
  lib.window.history = { pushState: (_s, _t, url) => pushed.push(url) };
  lib.window.dispatchEvent = (ev) => pushed.push(ev.type);
  card._action("integration");
  assert.deepEqual([...pushed], ["/config/integrations/integration/github", "location-changed"]);
});

test("embed (the panel's rows): only the counters and the latest activity, no frame, header or account", () => {
  const { html } = render(lib.GitHubCard, { embed: true, repositories: ["juju35/ha-parcel"], show_account: false }, hass());
  assert.match(html, /class="content embed"/);
  assert.match(html, /Latest release/);
  assert.match(html, /v1\.4\.0/);
  assert.doesNotMatch(html, /<ha-card/);
  assert.doesNotMatch(html, /class="repo-head/);
  assert.doesNotMatch(html, /Account ·/);
  assert.doesNotMatch(render(lib.GitHubCard, { embed: true, repositories: ["juju35/ha-parcel"], show_latest: false, show_account: false }, hass()).html, /Latest release/);
});

test("embed without repositories (the panel's account): the account section only, nothing without its sensors", () => {
  const { html } = render(lib.GitHubCard, { embed: true }, hass());
  assert.match(html, /Account · octocat/);
  assert.match(html, /Followers/);
  assert.doesNotMatch(html, /Latest release/);
  assert.equal(render(lib.GitHubCard, { embed: true }, { ...hass(), entities: {} }).html, "");
});
