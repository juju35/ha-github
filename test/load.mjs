// Evaluates custom_components/github_card/frontend/github-card.js (a plain script, not a module) in a sandbox with just enough browser stubs to define
// the cards, and returns its internal helpers for the tests.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const NAMES = ["discover", "keyOf", "fmtCount", "safeUrl", "lang", "STRINGS", "TRANSLATIONS", "KEYS", "LANGUAGES", "GitHubCard", "GitHubMiniCard", "GitHubCardEditor", "GitHubMiniCardEditor", "document", "window"];

export const load = () => {
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
  };
  context.window = context;
  vm.createContext(context);
  return vm.runInContext(`${src}\n;({ ${NAMES.join(", ")} })`, context);
};

/** A card of class `Cls` rendered with `config` on `hass`; returns the card and its markup. */
export const render = (Cls, config, hass) => {
  const card = new Cls();
  card.setConfig({ type: "custom:x", ...config });
  card.hass = hass;
  return { card, html: card.shadowRoot.innerHTML };
};
