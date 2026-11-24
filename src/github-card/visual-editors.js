// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { LANGUAGES } from "./strings.js";
import { t } from "./helpers.js";
import { discover } from "./discovery.js";

export class GitHubEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  static get defaults() {
    return { sort: "name", illustration_theme: "auto" };
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const repos = this._hass ? discover(this._hass).repos.map((r) => r.name).filter(Boolean) : [];
    const extra = this._extraSchema?.() || [];
    return [
      { name: "title", selector: { text: {} } },
      { name: "repositories", selector: { select: { multiple: true, custom_value: true, mode: "dropdown", options: [...new Set(repos)].sort().map((r) => ({ value: r, label: r })) } } },
      {
        name: "sort",
        selector: { select: { mode: "dropdown", options: ["name", "stars", "open"].map((v) => ({ value: v, label: tr(`sort_${v}`) })) } },
      },
      { type: "grid", name: "", schema: this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })) },
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
      },
      ...extra,
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  /** Keeps the YAML minimal: no empty values, no toggles left on, no option at its default. */
  _clean(config) {
    const out = { ...config };
    const defaults = this.constructor.defaults;
    for (const [k, v] of Object.entries(out)) {
      const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
      if (empty || (this.constructor.toggles.includes(k) && v === true) || defaults[k] === v) delete out[k];
    }
    return out;
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => {
        const key = `${s.name}_helper`;
        const text = t(this._hass, this._config, key);
        return text === key ? undefined : text;
      };
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = this._clean(ev.detail.value);
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    // ha-form renders again on a new data or schema object: rebuild them only when they change.
    if (this._formConfig !== this._config) {
      this._formConfig = this._config;
      const data = { ...this.constructor.defaults, ...this._config };
      for (const name of this.constructor.toggles) if (data[name] === undefined) data[name] = true;
      this._form.data = data;
    }
    const schema = this._schema();
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
  }
}

export class GitHubCardEditor extends GitHubEditorBase {
  static get toggles() {
    return ["illustration", "show_title", "show_subtitle", "show_latest", "show_account"];
  }
}

export class GitHubMiniCardEditor extends GitHubEditorBase {
  static get toggles() {
    return ["illustration", "show_title", "show_subtitle", "show_latest", "show_account", "zoom"];
  }

  static get defaults() {
    return { sort: "name", illustration_theme: "auto", max_repos: 5 };
  }

  _extraSchema() {
    return [{ name: "max_repos", selector: { number: { min: 1, max: 20, step: 1, mode: "box" } } }];
  }
}
