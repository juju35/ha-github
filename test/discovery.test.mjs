import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const { discover, keyOf, safeUrl } = load();

test("repositories and accounts are grouped by device, sensors by translation key", () => {
  const gh = discover({ states, entities, devices });
  assert.deepEqual([...gh.repos.map((r) => r.name)].sort(), ["home-assistant/core", "juju35/ha-parcel", "juju35/ha-weather-card"]);
  assert.deepEqual([...gh.users.map((u) => u.name)], ["octocat"]);
  const core = gh.repos.find((r) => r.name === "home-assistant/core");
  assert.equal(core.s.stargazers_count, "sensor.home_assistant_core_stargazers_count");
  assert.equal(core.url, "https://github.com/home-assistant/core");
  assert.equal(gh.users[0].s.followers, "sensor.octocat_followers");
});

test("without a translation key, the English entity id gives the sensor", () => {
  const e = (entity_id) => ({ entity_id, platform: "github" });
  assert.equal(keyOf(e("sensor.home_assistant_core_stars")), "stargazers_count");
  assert.equal(keyOf(e("sensor.home_assistant_core_pull_requests")), "pulls_count");
  assert.equal(keyOf(e("sensor.home_assistant_core_merged_pull_requests")), "merged_pulls_count");
  assert.equal(keyOf(e("sensor.home_assistant_core_latest_pull_request")), "latest_pull_request");
  assert.equal(keyOf(e("sensor.octocat_public_repositories")), "public_repos");
  assert.equal(keyOf(e("sensor.home_assistant_core_something_else")), null);
  assert.equal(keyOf({ entity_id: "sensor.x_stars", translation_key: "unrelated" }), null);
});

test("other platforms, hidden entities and other domains are left out", () => {
  const extra = {
    "sensor.other_stars": { entity_id: "sensor.other_stars", platform: "other", translation_key: "stargazers_count" },
    "sensor.hidden_stars": { entity_id: "sensor.hidden_stars", platform: "github", translation_key: "stargazers_count", device_id: "h", hidden: true },
    "binary_sensor.x": { entity_id: "binary_sensor.x", platform: "github", translation_key: "stargazers_count", device_id: "b" },
  };
  const gh = discover({ states, entities: { ...entities, ...extra }, devices });
  assert.equal(gh.repos.length, 3);
});

test("a renamed device keeps its owner/repo name and shows the new name", () => {
  const renamed = { ...devices, dev_parcel: { ...devices.dev_parcel, name_by_user: "Parcel" } };
  const r = discover({ states, entities, devices: renamed }).repos.find((x) => x.id === "dev_parcel");
  assert.equal(r.name, "juju35/ha-parcel");
  assert.equal(r.label, "Parcel");
});

test("only web links are kept", () => {
  assert.equal(safeUrl("https://github.com/a/b"), "https://github.com/a/b");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl(undefined), "");
});
