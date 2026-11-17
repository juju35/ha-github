// Browser test (Chromium through Playwright) of the illustrated header's status pill: from 245 to 500 px, on the full
// card and the mini card (compact and zoomed), light and dark, in long languages, the pill shows its whole label,
// sits on the title's row (centred on it) from 400 px, and the title keeps at least four characters.
// Skipped when Playwright or Chromium is not installed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../custom_components/github_card/frontend/github-card.js", import.meta.url), "utf8");
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; } });`;
let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

test("the banner's status pill shows its whole label, beside the title from 400 px", { timeout: 180000 }, async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.setContent("<!doctype html><body style='margin:0;font-family:Roboto,Arial,sans-serif'></body>");
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const cases = [];
  for (const [type, zoom] of [["github-card", false], ["github-mini-card", false], ["github-mini-card", true]])
    for (const language of ["en", "fr", "de", "el", "hu"])
      for (const dark of [false, true]) for (const width of [245, 300, 400, 500]) cases.push({ type, zoom, language, dark, width });
  const results = await page.evaluate(
    async ({ cases, states, entities, devices }) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const out = [];
      for (const c of cases) {
        const box = document.body.appendChild(document.createElement("div"));
        box.style.width = `${c.width}px`;
        const el = document.createElement(c.type);
        el.setConfig({ type: `custom:${c.type}`, language: c.language });
        el.hass = { states, entities, devices, language: c.language, locale: { language: c.language }, themes: { darkMode: c.dark } };
        box.appendChild(el);
        await frame();
        if (c.zoom) {
          el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
          await frame();
        }
        const q = (s) => el.shadowRoot.querySelector(s);
        const pill = q(".banner .title-row > .chip");
        const tx = pill?.querySelector(".chip-text");
        const name = q(".banner .name").getBoundingClientRect();
        const p = pill?.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(q(".banner .name")).fontSize);
        out.push({
          ...c,
          label: pill?.getAttribute("title"),
          cut: tx ? tx.scrollWidth - tx.clientWidth : null,
          beside: p ? p.top < name.bottom - 2 : false,
          centred: p ? Math.abs((p.top + p.bottom) / 2 - (name.top + name.bottom) / 2) <= 2 : false,
          name: name.width / fs,
        });
        box.remove();
      }
      return out;
    },
    { cases, states, entities, devices },
  );
  await page.close();
  for (const r of results) {
    const at = `${r.type}${r.zoom ? " zoomed" : ""} ${r.language} ${r.dark ? "dark" : "light"} ${r.width}px`;
    assert.ok(r.cut !== null, `no pill: ${at}`);
    assert.ok(r.cut <= 0.5, `pill "${r.label}" cut by ${r.cut}px: ${at}`);
    assert.ok(r.name >= 1.9, `title shorter than 4 characters: ${at}`);
    if (r.beside) assert.ok(r.centred, `pill not centred on the title: ${at}`);
    if (r.width >= 400 && r.language === "en") assert.ok(r.beside, `pill not beside the title: ${at}`);
  }
});
