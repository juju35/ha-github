// Mock Home Assistant states, entity and device registries shaped like the GitHub integration, used to render the
// screenshots and by the tests: three repositories (one device each) and an account (its sensors enabled).
const REPOS = {
  dev_core: {
    name: "home-assistant/core",
    stats: { stargazers_count: 78412, forks_count: 33187, subscribers_count: 1384, issues_count: 2614, pulls_count: 642, merged_pulls_count: 61208, discussions_count: 0 },
    latest: {
      latest_release: ["2026.11.1", { tag: "2026.11.1", url: "https://github.com/home-assistant/core/releases/tag/2026.11.1" }],
      latest_tag: ["2026.11.1", { url: "https://github.com/home-assistant/core/releases/tag/2026.11.1" }],
      latest_commit: ["Bump the recorder schema to version 52", { sha: "4f9c2e1a7b3d", url: "https://github.com/home-assistant/core/commit/4f9c2e1a7b3d" }],
      latest_pull_request: ["Add diagnostics to the GitHub integration", { number: 155412, url: "https://github.com/home-assistant/core/pull/155412" }],
      latest_issue: ["Energy dashboard shows the wrong unit after an update", { number: 155398, url: "https://github.com/home-assistant/core/issues/155398" }],
    },
  },
  dev_parcel: {
    name: "juju35/ha-parcel",
    stats: { stargazers_count: 184, forks_count: 12, subscribers_count: 6, issues_count: 3, pulls_count: 1, merged_pulls_count: 96, latest_release_downloads: 412 },
    latest: {
      latest_release: ["v1.4.0", { tag: "v1.4.0", url: "https://github.com/juju35/ha-parcel/releases/tag/v1.4.0" }],
      latest_commit: ["feat: delivery window on the card", { sha: "a81d0c93e2f4", url: "https://github.com/juju35/ha-parcel/commit/a81d0c93e2f4" }],
      latest_pull_request: ["Translations: Greek and Latvian", { number: 97, url: "https://github.com/juju35/ha-parcel/pull/97" }],
      latest_issue: ["Carrier logo missing for a new carrier", { number: 94, url: "https://github.com/juju35/ha-parcel/issues/94" }],
    },
  },
  dev_weather: {
    name: "juju35/ha-weather-card",
    stats: { stargazers_count: 57, forks_count: 4, subscribers_count: 3, issues_count: 0, pulls_count: 0, merged_pulls_count: 41, latest_release_downloads: 128 },
    latest: {
      latest_release: ["v2.1.0", { tag: "v2.1.0", url: "https://github.com/juju35/ha-weather-card/releases/tag/v2.1.0" }],
      latest_commit: ["fix: pollen levels in the forecast", { sha: "c0ffee42d1b7", url: "https://github.com/juju35/ha-weather-card/commit/c0ffee42d1b7" }],
    },
  },
};

const USER = { id: "dev_user", name: "octocat", stats: { followers: 1240, following: 38, public_repos: 42, public_gists: 7 } };

export const states = {};
export const entities = {};
export const devices = {};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_");
const add = (deviceId, deviceName, key, state, attributes = {}) => {
  const id = `sensor.${slug(deviceName)}_${key}`;
  states[id] = { entity_id: id, state: String(state), attributes };
  entities[id] = { entity_id: id, platform: "github", device_id: deviceId, translation_key: key };
};

for (const [deviceId, r] of Object.entries(REPOS)) {
  devices[deviceId] = { id: deviceId, name: r.name, configuration_url: `https://github.com/${r.name}` };
  for (const [key, v] of Object.entries(r.stats)) add(deviceId, r.name, key, v, { state_class: "measurement" });
  for (const [key, [state, attributes]] of Object.entries(r.latest)) add(deviceId, r.name, key, state, attributes);
}
devices[USER.id] = { id: USER.id, name: USER.name, configuration_url: `https://github.com/${USER.name}` };
for (const [key, v] of Object.entries(USER.stats)) add(USER.id, USER.name, key, v, { state_class: "measurement" });

export const hass = (extra = {}) => ({ states: { ...states, ...extra }, entities, devices, language: "en", locale: { language: "en" } });
