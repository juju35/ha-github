import assert from "node:assert/strict";
import { test } from "node:test";
import { hass } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const lib = load();

test("editors keep the YAML minimal", () => {
  const e = new lib.GitHubMiniCardEditor();
  const clean = e._clean({ type: "custom:github-mini-card", title: "", repositories: [], sort: "name", max_repos: 5, zoom: true, show_latest: false, language: "fr" });
  assert.deepEqual({ ...clean }, { type: "custom:github-mini-card", show_latest: false, language: "fr" });
  const f = new lib.GitHubCardEditor();
  assert.deepEqual({ ...f._clean({ sort: "stars", max_repos: 5, show_account: true }) }, { sort: "stars", max_repos: 5 });
});

test("the editor lists the repositories found, and keeps its schema across state changes", () => {
  const e = new lib.GitHubCardEditor();
  e.setConfig({ type: "custom:github-card" });
  e.hass = hass();
  const schema = e._form.schema;
  const repos = schema.find((f) => f.name === "repositories").selector.select.options.map((o) => o.value);
  assert.deepEqual([...repos], ["home-assistant/core", "juju35/ha-parcel", "juju35/ha-weather-card"]);
  e.hass = hass({ "sensor.juju35_ha_parcel_stargazers_count": { entity_id: "x", state: "185", attributes: {} } });
  assert.equal(e._form.schema, schema);
  assert.equal(e._form.data.sort, "name");
  assert.equal(e._form.data.show_latest, true);
});

test("the mini card editor offers max_repos and the zoom toggle", () => {
  const e = new lib.GitHubMiniCardEditor();
  e._config = {};
  const schema = e._schema();
  assert.ok(schema.some((f) => f.name === "max_repos"));
  assert.ok(schema.find((f) => f.type === "grid").schema.some((f) => f.name === "zoom"));
});
