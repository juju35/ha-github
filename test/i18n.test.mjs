import assert from "node:assert/strict";
import { test } from "node:test";
import { I18N, load, render } from "./load.mjs";

const { STRINGS, LANGUAGES, lang } = load();
const KEYS = Object.keys(I18N.en.card);
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort();
const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];

test("every language of the convention has a file, and is offered in the editors", () => {
  assert.deepEqual(Object.keys(I18N).sort(), [...LANGS].sort());
  assert.deepEqual([...LANGUAGES.map(([l]) => l)].sort(), [...LANGS].sort());
});

test("every file has the card keys of en.json, non-empty, with the English placeholders", () => {
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(I18N[l].card).sort(), [...KEYS].sort(), `card keys of ${l}.json`);
    for (const k of KEYS) {
      assert.ok(String(STRINGS[l][k]).trim(), `empty ${l}.${k}`);
      assert.deepEqual(placeholders(STRINGS[l][k]), placeholders(STRINGS.en[k]), `placeholders of ${l}.${k}`);
    }
  }
});

test("counts use the label: {n} form in every language", () => {
  for (const l of LANGS) for (const k of ["repos_n", "open_n"]) assert.match(STRINGS[l][k], /:\s?\{n\}$/, `${l}.${k}`);
});

test("the language resolves to the full code, then its base, then English", () => {
  assert.equal(lang({ language: "fr-FR" }, {}), "fr");
  assert.equal(lang({ locale: { language: "sr-Latn" } }, {}), "sr-Latn");
  assert.equal(lang({ language: "pt-BR" }, {}), "pt");
  assert.equal(lang({ language: "el-GR" }, {}), "el");
  assert.equal(lang({ language: "ja" }, {}), "en");
  assert.equal(lang({ language: "en" }, { language: "uk" }), "uk");
});

test("every file is a JSON object with the card and panel sections only", () => {
  for (const l of LANGS) assert.deepEqual(Object.keys(I18N[l]).sort(), ["card", "panel"], `${l}.json`);
});

test("the card loads its language file (and English) once, then draws", async () => {
  const urls = [];
  const fetch = async (url) => {
    urls.push(url);
    const l = url.match(/\/i18n\/([\w-]+)\.json\?v=/)[1];
    return { ok: Boolean(I18N[l]), json: async () => I18N[l] };
  };
  const lib = load({ seed: false, fetch });
  const hass = { language: "fr", states: {}, entities: {}, devices: {} };
  assert.ok(lib.pendingStrings(hass, {}));
  const { card, html } = render(lib.GitHubCard, {}, hass);
  assert.equal(html, ""); // not drawn before its strings are in
  await lib.pendingStrings(hass, {});
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(lib.pendingStrings(hass, {}), null);
  assert.match(card.shadowRoot.innerHTML, /GitHub/);
  assert.deepEqual(urls.map((u) => u.split("?")[0]).sort(), ["/github_card/i18n/en.json", "/github_card/i18n/fr.json"]);
  assert.equal(lib.STRINGS.fr.no_repos, I18N.fr.card.no_repos);
});

test("a failed load falls back to English, then to the key", async () => {
  const lib = load({ seed: false, fetch: async () => { throw new Error("offline"); } });
  const hass = { language: "de" };
  await lib.pendingStrings(hass, {});
  assert.equal(lib.pendingStrings(hass, {}), null);
  assert.deepEqual({ ...lib.STRINGS.de }, {});
});
