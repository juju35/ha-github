// Renders the cards with mock GitHub data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
// Then records the header animations into screenshots/*.gif, light and dark (needs ffmpeg).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    // The row sensors of the followed repositories: the mock states' entity ids (sensor.<owner>_<repo>_<key>)
    sensors: Object.fromEntries(
      ["home-assistant/core", "juju35/ha-parcel", "juju35/ha-weather-card"].map((repo) => [
        repo,
        Object.fromEntries(
          ["stargazers_count", "forks_count", "issues_count", "pulls_count", "latest_release", "latest_release_downloads"]
            .map((key) => [key, `sensor.${repo.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${key}`])
            .filter(([, id]) => states[id]),
        ),
      ]),
    ),
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
  "github_card/mine": {
    pulls: [
      { repo: "home-assistant/core", number: 155412, title: "Add diagnostics to the GitHub integration", url: "https://github.com/home-assistant/core/pull/155412",
        updated: new Date(NOW - 40 * 60e3).toISOString(), comments: 3, labels: [{ name: "integration: github", color: "fbca04" }], draft: false, review: "REVIEW_REQUIRED", checks: "SUCCESS" },
      { repo: "home-assistant/home-assistant.io", number: 41022, title: "Document the GitHub Card refresh interval", url: "https://github.com/home-assistant/home-assistant.io/pull/41022",
        updated: new Date(NOW - 22 * 3600e3).toISOString(), comments: 1, labels: [{ name: "current", color: "0e8a16" }], draft: false, review: "CHANGES_REQUESTED", checks: "FAILURE" },
      { repo: "juju35/ha-parcel", number: 97, title: "Translations: Greek and Latvian", url: "https://github.com/juju35/ha-parcel/pull/97",
        updated: new Date(NOW - 3 * 86400e3).toISOString(), comments: 0, labels: [{ name: "i18n", color: "5319e7" }], draft: true, review: null, checks: "PENDING" },
    ],
    viewer: "juju35",
    fetched_at: NOW / 1000,
    error: null,
  },
  "github_card/settings": { settings: { filter: "juju35/ha-*", include_starred: true, ignore_archived: true, notify_issues: true, notify_pulls: false, notify_releases: false, refresh_minutes: 15, hide_toolbar: false } },
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
    ({ type, config, states, entities, devices, open, zoom, merge, panel, mock, expand, select, sidebar, dark }) => {
      if (sidebar) {
        // A faithful mock of Home Assistant's sidebar entry with the count badge (open issues + pull requests),
        // amber here because there are open issues, like the native notifications count. No real sidebar is mounted.
        const GITHUB =
          "M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z";
        const HOME = "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z";
        const COG =
          "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z";
        const icon = (path, color) =>
          `<svg viewBox="0 0 24 24" style="width:24px;height:24px;flex:none;fill:${color};"><path d="${path}"></path></svg>`;
        const row = (path, label, on, badge) =>
          `<div style="display:flex;align-items:center;gap:14px;padding:10px 16px;font-size:14px;` +
          (on
            ? `background:rgba(3,169,244,.12);border-left:3px solid var(--primary-color);padding-left:13px;color:var(--primary-color);"`
            : `color:var(--secondary-text-color);"`) +
          `>${icon(path, on ? "var(--primary-color)" : "var(--secondary-text-color)")}` +
          `<span style="flex:1;${on ? "" : "color:var(--primary-text-color);"}">${label}</span>` +
          (badge
            ? `<span class="badge" style="min-width:18px;height:18px;box-sizing:border-box;padding:0 5px;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;font-size:11px;font-weight:500;line-height:1;background:var(--warning-color);color:rgba(0,0,0,.87);">${badge}</span>`
            : "") +
          `</div>`;
        document.getElementById("root").innerHTML =
          `<div style="--warning-color:#ffa600;width:224px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px;overflow:hidden;">` +
          `<div style="padding:14px 16px;font-weight:500;color:var(--primary-text-color);border-bottom:1px solid var(--divider-color);">Home Assistant</div>` +
          `<div style="padding:6px 0;">${row(HOME, "Overview", false, "")}${row(GITHUB, "GitHub", true, "3")}${row(COG, "Settings", false, "")}</div>` +
          `</div>`;
        return;
      }
      if (panel) {
        // The sidebar panel, its WebSocket commands answered with the mock repositories and settings.
        const el = document.createElement("github-panel");
        el.panel = { url_path: "github-config", config: { version: "test" } };
        el.route = { path: `/${panel}` };
        el._expanded = expand || null;
        // Repositories ticked to follow them together
        if (select) el._selected = new Set(select);
        el.hass = {
          states, entities, devices, language: "en", locale: { language: "en" },
          themes: { darkMode: dark },
          // The issues and pull requests come through their subscription, as from the background poller
          connection: {
            subscribeMessage: (cb, msg) => {
              if (msg?.type === "github_card/subscribe_items") setTimeout(() => cb(mock["github_card/items"]));
              return Promise.resolve(() => {});
            },
          },
          callWS: async (msg) => mock[msg.type],
        };
        document.getElementById("root").appendChild(el);
        return;
      }
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = { states, entities, devices, language: "en", locale: { language: "en" }, themes: { darkMode: dark } };
      document.getElementById("root").appendChild(el);
      // The repository shown unfolded, or the zoom of the mini card on a repository (as a click on its line does).
      // A pull request just merged: the merge drawn for ten minutes, as when the merged count goes up.
      if (merge) {
        el._mergedAt = Date.now();
        el._update();
      }
      if (zoom) el._setZoom(true, zoom);
      else if (open) {
        el._openRepo = open;
        el._update();
      }
    },
    { type: s.type, config: s.config, states, entities: s.accountOnly ? accountOnly : entities, devices, open: s.open, zoom: s.zoom, merge: s.merge, panel: s.panel, mock: panelMock, expand: s.expand, select: s.select, sidebar: s.sidebar, dark: s.theme === "dark" }
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

// Animated captures: the full card's header, one GIF per state, light and dark. The CSS animations are paused and
// stepped frame by frame over a 7.2 s loop; each animation runs a whole number of its cycles in it (the closest to its
// real speed), so every GIF loops seamlessly whatever the machine's speed.
const FPS = 15;
const LOOP = 7200;
const WEATHER = { title: "ha-weather", repositories: ["juju35/ha-weather-card"], show_account: false };
const GIFS = [
  // Open issues and pull requests: commits pop along the graph, the head commit pulses, the amber count blinks.
  { name: "anim-issues", config: {} },
  // Nothing open: the same flow, without a count.
  { name: "anim-nothing-open", config: WEATHER },
  // A pull request just merged: the branch draws in and joins main.
  { name: "anim-merged", config: WEATHER, merge: true },
  // Night picture.
  { name: "anim-night", config: { illustration_theme: "night" } },
];

// Pauses every CSS animation of the page (shadow trees walked by hand) at `frac` of the loop, then waits until the
// paused state is drawn: transform and opacity animations run on the compositor, which applies a new currentTime a
// frame later — a capture taken at once can catch the previous frame, and that one pixel off changes the palette of
// the whole GIF from one run to the next.
const freeze = (page, frac) =>
  page.evaluate(
    async ({ f, loop }) => {
      const walk = (node) => [...node.querySelectorAll("*")].flatMap((el) => [...el.getAnimations(), ...(el.shadowRoot ? walk(el.shadowRoot) : [])]);
      const anims = walk(document);
      for (const a of anims) {
        const d = a.effect.getTiming().duration;
        a.pause();
        a.currentTime = (10 + f * Math.max(1, Math.round(loop / d))) * d;
      }
      await Promise.all(anims.map((a) => a.ready));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    },
    { f: frac, loop: LOOP },
  );

for (const g of GIFS) {
  for (const theme of ["light", "dark"]) {
    const file = `${g.name}${theme === "dark" ? "-dark" : ""}`;
    const s = { file, theme, type: "github-card", width: 460, config: { illustration_theme: "day", ...g.config }, merge: g.merge };
    const page = await openCard(s);
    // The header with the 16 px of theme background around the card.
    const bottom = await page.evaluate(() => document.querySelector("#root > *").shadowRoot.querySelector(".banner").getBoundingClientRect().bottom);
    const clip = { x: 0, y: 0, width: s.width + 32, height: Math.ceil(bottom) };
    const dir = mkdtempSync(join(tmpdir(), "gh-frames-"));
    const frames = Math.round((FPS * LOOP) / 1000);
    for (let i = 0; i < frames; i++) {
      await freeze(page, i / frames);
      await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
    }
    // A deterministic GIF: palette from the frames only, ordered dithering, bit-exact muxing.
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
      "-vf", `scale=${s.width + 32}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
      "-fflags", "+bitexact", "-flags", "+bitexact", "-loop", "0", join(dir, "out.gif"),
    ]);
    const written = writeIfChanged(`${root}screenshots/${file}.gif`, readFileSync(join(dir, "out.gif")));
    console.log(`screenshots/${file}.gif${written ? "" : " (unchanged)"}`);
    rmSync(dir, { recursive: true });
    await page.close();
  }
}

await browser.close();
