// Evaluates custom_components/github_card/frontend/github-card.js (a plain script, not a module) in a sandbox with just enough browser stubs to define
// the cards, and returns its internal helpers for the tests.
import { readdirSync, readFileSync } from "node:fs";
import vm from "node:vm";

const NAMES = ["discover", "keyOf", "fmtCount", "safeUrl", "lang", "STRINGS", "addStrings", "pendingStrings", "LANGUAGES", "GitHubCard", "GitHubMiniCard", "GitHubCardEditor", "GitHubMiniCardEditor", "document", "window"];

const I18N_DIR = new URL("../custom_components/github_card/frontend/i18n/", import.meta.url);

/** The translation files, by language: { card: {...}, panel: {...} }. */
export const I18N = Object.fromEntries(
  readdirSync(I18N_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(new URL(f, I18N_DIR), "utf8"))]),
);

/** The card's script; its strings are seeded from the files unless `seed` is false, `fetch` stands for the browser's. */
export const load = ({ seed = true, fetch } = {}) => {
  const src = readFileSync(new URL("../custom_components/github_card/frontend/github-card.js", import.meta.url), "utf8");
  const defined = new Map();
  const context = {
    HTMLElement: class {
      attachShadow() {
        this.shadowRoot = { addEventListener() {}, querySelector: () => null, innerHTML: "" };
        return this.shadowRoot;
      }
      dispatchEvent(ev) {
        (this.events ||= []).push(ev);
      }
      appendChild() {}
    },
    customElements: { get: (n) => defined.get(n), define: (n, c) => defined.set(n, c) },
    document: { addEventListener() {}, removeEventListener() {}, createElement: () => ({ addEventListener() {} }) },
    console: { info() {}, log: console.log },
    CustomEvent: class {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
    Intl,
    setTimeout,
    addEventListener() {},
    removeEventListener() {},
    fetch,
  };
  context.window = context;
  vm.createContext(context);
  const lib = vm.runInContext(`${src}\n;({ ${NAMES.join(", ")} })`, context);
  if (seed) for (const [l, file] of Object.entries(I18N)) lib.addStrings(l, file.card);
  return lib;
};

/** A card of class `Cls` rendered with `config` on `hass`; returns the card and its markup. */
export const render = (Cls, config, hass) => {
  const card = new Cls();
  card.setConfig({ type: "custom:x", ...config });
  card.hass = hass;
  return { card, html: card.shadowRoot.innerHTML };
};
