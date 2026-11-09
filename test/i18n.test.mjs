import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { TRANSLATIONS, KEYS, STRINGS, LANGUAGES, lang } = load();
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort();
const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];

test("every language of the convention is there, and offered in the editors", () => {
  assert.deepEqual([...Object.keys(TRANSLATIONS)].sort(), [...LANGS].sort());
  assert.deepEqual([...LANGUAGES.map(([l]) => l)].sort(), [...LANGS].sort());
});

test("every language has one non-empty string per key, with the English placeholders", () => {
  for (const l of LANGS) {
    assert.equal(TRANSLATIONS[l].length, KEYS.length, `number of strings of ${l}`);
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
