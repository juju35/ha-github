// Renders the cards with mock GitHub data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { accountOnly, devices, entities, states } from "./mock-states.mjs";
import { shots } from "./screenshot-shots.mjs";
import { writeIfChanged } from "./screenshot-write.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
// Every page reads the same fixed moment, so that a capture never depends on when the run happened.
const NOW = Date.now();
const cardJs = readFileSync(`${root}custom_components/github_card/frontend/github-card.js`, "utf8");
const panelJs = readFileSync(`${root}custom_components/github_card/frontend/github-panel.js`, "utf8");

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

// Minimal stand-in for Home Assistant's <ha-card>.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});`;

const page_html = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { --app-header-background-color: ${theme === "dark" ? "#1c1c1c" : "#03a9f4"}; --app-header-text-color: ${theme === "dark" ? "#e1e1e1" : "#ffffff"};
          --primary-color: #03a9f4; ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;


// Answers of the panel's commands: the card's three mock repositories followed, a few more of the account offered.
const panelMock = {
  "github_card/repositories": {
    configured: true,
    state: "loaded",
    login: "juju35",
    followed: ["home-assistant/core", "juju35/ha-parcel", "juju35/ha-weather-card"],
    offered: ["juju35/ha-alarm-card", "juju35/ha-calendar-card", "juju35/ha-energy-card", "juju35/ha-iptv", "juju35/ha-mower-card"],
    offered_error: false,
  },
  "github_card/items": {
    issues: [
      { repo: "home-assistant/core", number: 155398, title: "Energy dashboard shows the wrong unit after an update", url: "https://github.com/home-assistant/core/issues/155398",
        author: "octocat", updated: new Date(NOW - 2 * 3600e3).toISOString(), comments: 7, labels: [{ name: "integration: energy", color: "fbca04" }, { name: "bug", color: "d73a4a" }] },
      { repo: "juju35/ha-parcel", number: 94, title: "Carrier logo missing for a new carrier", url: "https://github.com/juju35/ha-parcel/issues/94",
        author: "octocat", updated: new Date(NOW - 26 * 3600e3).toISOString(), comments: 2, labels: [{ name: "enhancement", color: "a2eeef" }] },
      { repo: "juju35/ha-weather-card", number: 31, title: "Pollen levels: show the forecast for tomorrow", url: "https://github.com/juju35/ha-weather-card/issues/31",
        author: "hubot", updated: new Date(NOW - 5 * 86400e3).toISOString(), comments: 0, labels: [] },
    ],
    pulls: [
      { repo: "home-assistant/core", number: 155412, title: "Add diagnostics to the GitHub integration", url: "https://github.com/home-assistant/core/pull/155412",
        author: "octocat", updated: new Date(NOW - 40 * 60e3).toISOString(), comments: 3, labels: [{ name: "integration: github", color: "fbca04" }], draft: false, review: "APPROVED" },
      { repo: "juju35/ha-parcel", number: 97, title: "Translations: Greek and Latvian", url: "https://github.com/juju35/ha-parcel/pull/97",
        author: "hubot", updated: new Date(NOW - 20 * 3600e3).toISOString(), comments: 1, labels: [{ name: "i18n", color: "0e8a16" }], draft: false, review: "REVIEW_REQUIRED" },
      { repo: "home-assistant/core", number: 155380, title: "Bump the recorder schema to version 52", url: "https://github.com/home-assistant/core/pull/155380",
        author: "octocat", updated: new Date(NOW - 3 * 86400e3).toISOString(), comments: 0, labels: [], draft: true, review: null },
    ],
    totals: { "home-assistant/core": { issues: 2614, pulls: 642 }, "juju35/ha-parcel": { issues: 3, pulls: 1 }, "juju35/ha-weather-card": { issues: 1, pulls: 0 } },
    fetched_at: NOW / 1000,
    error: null,
  },
  "github_card/settings": { settings: { filter: "juju35/ha-*", include_starred: true, notify_issues: true, notify_pulls: false } },
};

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
// Mounts shot `s` on a fresh page (the card's script declares classes and custom elements once per page), settles
// it and clears the focus ring; returns the page ready to capture.
async function openCard(s) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  await page.clock.setFixedTime(NOW);
  page.on("pageerror", (err) => console.error(`${s.file}: ${err.message}`));
  await page.setContent(page_html(s.theme, s.width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  if (s.panel) await page.addScriptTag({ content: panelJs });
  await page.evaluate(
    ({ type, config, states, entities, devices, open, zoom, panel, mock }) => {
      if (panel) {
        // The sidebar panel, its WebSocket commands answered with the mock repositories and settings.
        const el = document.createElement("github-panel");
        el.panel = { url_path: "github-config", config: { version: "test" } };
        el.route = { path: `/${panel}` };
        el.hass = {
          states, entities, devices, language: "en", locale: { language: "en" },
          connection: { subscribeMessage: () => Promise.resolve(() => {}) },
          callWS: async (msg) => mock[msg.type],
        };
        document.getElementById("root").appendChild(el);
        return;
      }
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = { states, entities, devices, language: "en", locale: { language: "en" } };
      document.getElementById("root").appendChild(el);
      // The repository shown unfolded, or the zoom of the mini card on a repository (as a click on its line does).
      if (zoom) el._setZoom(true, zoom);
      else if (open) {
        el._openRepo = open;
        el._update();
      }
    },
    { type: s.type, config: s.config, states, entities: s.accountOnly ? accountOnly : entities, devices, open: s.open, zoom: s.zoom, panel: s.panel, mock: panelMock }
  );
  await page.waitForTimeout(800);
  return page;
}

for (const s of shots) {
  const page = await openCard(s);
  const box = await page.locator("#root").boundingBox();
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  // Rewritten only when the pixels change: an identical picture never shows up as a modified file.
  const written = writeIfChanged(`${root}screenshots/${s.file}.png`, png);
  console.log(`screenshots/${s.file}.png${written ? "" : " (unchanged)"}`);
  await page.close();
}

await browser.close();
