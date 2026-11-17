import assert from "node:assert/strict";
import { test } from "node:test";
import { hass } from "../scripts/mock-states.mjs";
import { load, render } from "./load.mjs";

const lib = load();
const W = "sensor.juju35_ha_weather_card_";
const weather = { repositories: ["juju35/ha-weather-card"] };
const st = (state) => ({ state: String(state), attributes: {} });

test("illustrated header by default: desk picture, 10 px strip, status icon with the GitHub badge", () => {
  const { html } = render(lib.GitHubCard, weather, hass());
  assert.match(html, /class="banner gh-ok"/);
  assert.match(html, /--ic:var\(--gh-ok\)/);
  assert.match(html, /class="gh-scene"/);
  assert.match(html, /class="gh-ground"/);
  assert.match(html, /class="badge"/);
  assert.doesNotMatch(html, /class="header"/);
});

test("open issues and pull requests: amber icon and count badge, 99+ past 99", () => {
  let { html } = render(lib.GitHubCard, { repositories: ["juju35/ha-parcel"] }, hass());
  assert.match(html, /banner gh-issues/);
  assert.match(html, /--ic:var\(--gh-warn\)/);
  assert.match(html, /gh-badge issues[^]*?>4<\/text>/);
  ({ html } = render(lib.GitHubCard, {}, hass()));
  assert.match(html, />99\+<\/text>/);
});

test("a merged pull request shows the merge for a while, then the usual state", () => {
  const { card } = render(lib.GitHubCard, weather, hass());
  card.hass = hass({ [`${W}merged_pulls_count`]: st(42) });
  let html = card.shadowRoot.innerHTML;
  assert.match(html, /banner gh-merge/);
  assert.match(html, /--ic:var\(--gh-purple\)/);
  assert.match(html, /gh-mergeline/);
  card._mergedAt = Date.now() - 11 * 60 * 1000;
  card._update();
  html = card.shadowRoot.innerHTML;
  assert.match(html, /banner gh-ok/);
  card.disconnectedCallback();
});

test("unknown counters are grey, unavailable ones red", () => {
  const unknown = { [`${W}issues_count`]: st("unknown"), [`${W}pulls_count`]: st("unknown") };
  assert.match(render(lib.GitHubCard, weather, hass(unknown)).html, /banner gh-unknown[^]*--ic:var\(--gh-idle\)/);
  const down = { [`${W}issues_count`]: st("unavailable"), [`${W}pulls_count`]: st("unavailable") };
  assert.match(render(lib.GitHubCard, weather, hass(down)).html, /banner gh-error[^]*--ic:var\(--gh-crit\)/);
});

test("night: illustration_theme, else the sun, else the dark theme", () => {
  const night = (config, extra, themes) => {
    const h = { ...hass(extra), themes };
    return / night"/.test(render(lib.GitHubCard, { ...weather, ...config }, h).html);
  };
  assert.equal(night({ illustration_theme: "night" }), true);
  assert.equal(night({ illustration_theme: "day" }, { "sun.sun": st("below_horizon") }), false);
  assert.equal(night({}, { "sun.sun": st("below_horizon") }), true);
  assert.equal(night({}, { "sun.sun": st("above_horizon") }, { darkMode: true }), false);
  assert.equal(night({}, {}, { darkMode: true }), true);
});

test("illustration: false keeps the classic header; mini card has the banner and its zoom button on it", () => {
  const { html } = render(lib.GitHubCard, { ...weather, illustration: false }, hass());
  assert.match(html, /class="header"/);
  assert.doesNotMatch(html, /gh-scene|banner/);
  const mini = render(lib.GitHubMiniCard, {}, hass()).html;
  assert.match(mini, /class="banner gh-issues[^]*class="zoom"/);
});

test("each card has its own clip path id", () => {
  const a = render(lib.GitHubCard, weather, hass()).html.match(/id="(gh-scr-\d+)"/)[1];
  const b = render(lib.GitHubCard, weather, hass()).html.match(/id="(gh-scr-\d+)"/)[1];
  assert.notEqual(a, b);
});

test("editors offer the illustration toggle and theme, and keep them out of the YAML at their defaults", () => {
  for (const Editor of [lib.GitHubCardEditor, lib.GitHubMiniCardEditor]) {
    const e = new Editor();
    e._config = {};
    const names = e._schema().flatMap((f) => (f.type === "grid" ? f.schema.map((g) => g.name) : [f.name]));
    assert.ok(names.includes("illustration"));
    assert.ok(names.includes("illustration_theme"));
    assert.equal(JSON.stringify(e._clean({ type: "custom:github-card", illustration: true, illustration_theme: "auto" })), '{"type":"custom:github-card"}');
    assert.equal(e._clean({ illustration: false, illustration_theme: "night" }).illustration_theme, "night");
  }
});
