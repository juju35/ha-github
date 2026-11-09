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
const cardJs = readFileSync(`${root}dist/github-card.js`, "utf8");

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
  :root { ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;


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
  await page.evaluate(
    ({ type, config, states, entities, devices, open, zoom }) => {
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
    { type: s.type, config: s.config, states, entities: s.accountOnly ? accountOnly : entities, devices, open: s.open, zoom: s.zoom }
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
