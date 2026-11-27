// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
import { ICONS, textWidth } from "./core.js";
import { esc, fireMoreInfo, fmtCount, fmtFull, fmtLang, inDialog, isUnknown, safeUrl, svgIcon, t, watchOutside } from "./helpers.js";
import { REPO_LATEST, REPO_STATS, USER_STATS, discover, focusSelector, renderSignature, sameSignature } from "./discovery.js";
import { BANNER_STYLE, BASE_STYLE, FULL_STYLE, GH_MERGE_MS, GH_STATE_COLOR, INTEGRATION_PATH, MINI_STYLE, ghIsNight, ghSceneSvg, navigate } from "./styles.js";
import { rcMorph } from "./in-place-redraw.js";

export let ghUid = 0;

export class GitHubBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._uid = ++ghUid;
    this._html = "";
    this._openRepo = null;
    // No rewrite of the card between a press and its click: Home Assistant updates the card several times a second,
    // and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself and
    // does nothing. The update held back is drawn once released: by the click (registered before the card's own
    // handler, which renders at once), else right after the release.
    this._onPress = () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    };
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    this._onPressClick = (ev) => {
      if (ev.detail === 0) this._byPointer = false;
      this._pressing = false;
    };
    this.shadowRoot.addEventListener("pointerdown", this._onPress);
    this.shadowRoot.addEventListener("click", this._onPressClick);
    // From the keyboard, the focus is kept across rewrites (with the pointer it would draw the focus ring).
    this.shadowRoot.addEventListener("keydown", () => {
      this._byPointer = false;
    });
    this.shadowRoot.addEventListener("click", (ev) => {
      const path = ev.composedPath();
      // A link to GitHub opens in a new tab: no other action.
      if (path.some((n) => n.localName === "a")) return;
      const action = path.find((n) => n.dataset?.action);
      if (action) return this._action(action.dataset.action, action.dataset.target, ev);
      const el = path.find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target?.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // A tap elsewhere folds the unfolded repository (as in ha-carburants-france).
    this._outside = watchOutside(
      (ev) => !ev.composedPath().includes(this) && !inDialog(ev),
      () => {
        if (this._openRepo === null) return;
        this._openRepo = null;
        this._update();
      },
    );
  }

  connectedCallback() {
    this._outside.on();
    if (!this._fitObserver && typeof ResizeObserver === "function") this._fitObserver = new ResizeObserver(() => this._fitPill());
    this._fitObserver?.observe(this);
    document.fonts?.ready?.then(() => this._fitPill());
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
  }

  // The banner's status pill, measured after each render and on a new width (in every language): it sits on the
  // title's row, right after the title, only when the whole title and the pill's whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.below), the title whole on its row (cut only when it does not fit
  // alone) and the subtitle on one line. When the three lines do not fit in the banner above the ground strip, or
  // the label does not fit its line, the pill shows its dot alone (.dot-only): beside the title when the whole title
  // leaves it room, else under the subtitle.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".htext .titles") || []) {
      const row = t.querySelector(".title-row");
      const chips = row ? [...row.querySelectorAll(":scope > .chip")] : [];
      if (!chips[0]?.getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".name");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const room = row.getBoundingClientRect().width;
      const title = name && getComputedStyle(name).display !== "none" ? textWidth(name) + gap : 0;
      const pills = () => chips.reduce((w, c) => w + c.getBoundingClientRect().width, gap * (chips.length - 1));
      if (title + pills() <= room) continue;
      t.classList.add("below");
      const banner = t.closest(".banner") || t;
      const ground = banner.querySelector(".gh-ground");
      const floor = ground ? ground.getBoundingClientRect().top : banner.getBoundingClientRect().bottom;
      const box = t.getBoundingClientRect();
      const whole = chips.every((c) => {
        const tx = c.querySelector(".chip-text");
        return !tx || tx.scrollWidth <= tx.clientWidth + 0.5;
      });
      if (whole && box.bottom <= floor + 0.5 && box.top >= banner.getBoundingClientRect().top - 0.5) continue;
      t.classList.add("dot-only");
      if (title + pills() <= room) t.classList.remove("below");
    }
  }

  disconnectedCallback() {
    this._fitObserver?.disconnect();
    this._pressing = this._dirty = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    this._outside.off();
    clearTimeout(this._mergeTimer);
    // Left (another dashboard view, a conditional card hidden): the repository folds back.
    this._openRepo = null;
  }

  set hass(hass) {
    this._hass = hass;
    const sig = renderSignature(hass);
    if (sameSignature(this._sig, sig)) return;
    this._sig = sig;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.repositories !== undefined && !Array.isArray(config.repositories))
      throw new Error("repositories must be a list of owner/repo names");
    this._config = { ...config };
    this._mergedKey = this._mergedAt = null;
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._update();
  }

  _action(action, target) {
    if (action === "integration") return navigate(INTEGRATION_PATH);
    if (action === "repo") {
      this._openRepo = this._openRepo === target ? null : target;
      this._update();
    }
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  /** A counter sensor as a number, or null when missing, unavailable or not a number. */
  _num(id) {
    const s = this._s(id);
    if (isUnknown(s)) return null;
    const v = Number.parseFloat(s.state);
    return Number.isFinite(v) ? v : null;
  }

  _update() {
    if (!this._hass || !this._config) return;
    // Held back under a press (see the constructor): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    const html = this._render();
    if (html !== this._html) {
      // Kept across the rewrite for the keyboard only (with the pointer it would draw the focus ring).
      const focused = this._byPointer ? null : focusSelector(this.shadowRoot.activeElement);
      this._html = html;
      // In place (see rcMorph): the nodes stay, so the card keeps its height, its animations and its focus.
      rcMorph(this.shadowRoot, html);
      this._fitPill();
      if (focused) this.shadowRoot.querySelector(focused)?.focus({ preventScroll: true });
    }
  }

  /** Open issues and pull requests of a repository (null when neither is known). */
  _openCount(r) {
    const a = this._num(r.s.issues_count);
    const b = this._num(r.s.pulls_count);
    return a === null && b === null ? null : (a || 0) + (b || 0);
  }

  /**
   * The repositories shown: those with a state, restricted to `repositories` (owner/repo, any case) when set, in its
   * order, else sorted by name; `sort: stars` or `sort: open` puts the most starred or the busiest first.
   */
  _repos() {
    const gh = discover(this._hass);
    const c = this._config;
    let list = gh.repos.filter((r) => Object.values(r.s).some((id) => this._hass.states[id]));
    const want = (c.repositories || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    const rank = (r) => {
      const i = want.findIndex((w) => w === r.name.toLowerCase() || w === r.label.toLowerCase());
      return i < 0 ? Infinity : i;
    };
    if (want.length) list = list.filter((r) => rank(r) !== Infinity);
    const byName = (a, b) => a.label.localeCompare(b.label);
    const sort = c.sort || (want.length ? "config" : "name");
    const value = (r) => (sort === "stars" ? this._num(r.s.stargazers_count) : this._openCount(r)) ?? -1;
    if (sort === "config") list.sort((a, b) => rank(a) - rank(b));
    else if (sort === "stars" || sort === "open") list.sort((a, b) => value(b) - value(a) || byName(a, b));
    else list.sort(byName);
    return list;
  }

  _users() {
    if (this._config.show_account === false) return [];
    return discover(this._hass).users.filter((u) => Object.values(u.s).some((id) => this._hass.states[id]));
  }

  _sum(repos, key) {
    const values = repos.map((r) => this._num(r.s[key])).filter((v) => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  }

  /** Overall status: the open issues and pull requests of the repositories shown. */
  _status(repos) {
    if (!repos.length) return { cls: "muted", text: this._t("no_repos") };
    const counts = repos.map((r) => this._openCount(r)).filter((v) => v !== null);
    if (!counts.length) return { cls: "muted", text: this._t("unknown") };
    const n = counts.reduce((a, b) => a + b, 0);
    return n ? { cls: "open", text: this._t("open_n").replace("{n}", fmtFull(n, this._loc())) } : { cls: "good", text: this._t("open_none") };
  }

  _header(repos, aside = "") {
    const st = this._status(repos);
    // Without a repository, the message under the header says so: no pill.
    const chip = repos.length
      ? `<span class="chip ${st.cls}" title="${esc(st.text)}" aria-label="${esc(st.text)}"><span class="dot"></span><span class="chip-text">${esc(st.text)}</span></span>`
      : "";
    const stars = this._sum(repos, "stargazers_count");
    const sub = [repos.length ? this._t("repos_n").replace("{n}", repos.length) : "", stars !== null ? `★ ${fmtCount(stars, this._loc())}` : ""].filter(Boolean).join(" · ");
    const titles = `<div class="titles">
          <div class="title-row"><div class="name">${esc(this._config.title || "GitHub")}</div>${chip}</div>
          <div class="sub" title="${esc(sub)}">${esc(sub)}</div>
        </div>`;
    // Classic header (illustration: false): the round tinted GitHub icon, the title and the subtitle.
    if (this._config.illustration === false)
      return `
      <div class="header">
        <span class="logo" aria-hidden="true">${svgIcon(ICONS.github)}</span>
        ${titles}
        ${aside}
      </div>`;
    const il = this._illus(repos);
    const cls = `banner gh-${il.state}${ghIsNight(this._hass, this._config) ? " night" : ""}`;
    return `
      <div class="${cls}" style="--ic:${GH_STATE_COLOR[il.state]}">${ghSceneSvg(this._uid, il.state, il.label)}<div class="gh-ground"></div>
        <div class="htext">
          <span class="logo" aria-hidden="true">${svgIcon(ICONS.trend)}<span class="badge">${svgIcon(ICONS.github)}</span></span>
          ${titles}
        </div>
        ${aside}
      </div>`;
  }

  /**
   * State of the illustration: `ok` (nothing open), `issues` (open issues and pull requests, `label` their count),
   * `merge` (a pull request merged in the last minutes), `unknown` (no repository or no count), `error` (unavailable).
   */
  _illus(repos) {
    if (!repos.length) return { state: "unknown" };
    const counts = repos.map((r) => this._openCount(r)).filter((v) => v !== null);
    if (!counts.length) {
      const unavailable = repos.some((r) => Object.values(r.s).some((id) => this._s(id)?.state === "unavailable"));
      return { state: unavailable ? "error" : "unknown" };
    }
    if (this._merging(repos)) return { state: "merge" };
    const n = counts.reduce((a, b) => a + b, 0);
    return n ? { state: "issues", label: n > 99 ? "99+" : String(n) } : { state: "ok" };
  }

  /** True for GH_MERGE_MS after the merged pull requests of the same repositories went up; redraws when it ends. */
  _merging(repos) {
    const total = this._sum(repos, "merged_pulls_count");
    const key = repos.map((r) => r.id).join("|");
    if (total !== null) {
      if (this._mergedKey === key && total > this._mergedTotal) this._mergedAt = Date.now();
      this._mergedKey = key;
      this._mergedTotal = total;
    }
    const left = this._mergedAt ? this._mergedAt + GH_MERGE_MS - Date.now() : 0;
    clearTimeout(this._mergeTimer);
    if (left <= 0) return false;
    this._mergeTimer = setTimeout(() => this._update(), left + 50);
    return true;
  }

  _tile(id, label, icon, cls) {
    const v = this._num(id);
    const title = `${label}: ${fmtFull(v, this._loc())}`;
    return `<div class="tile clickable ${cls}" data-entity="${esc(id)}" role="button" tabindex="0" title="${esc(title)}" aria-label="${esc(title)}">${svgIcon(icon)}<div>
        <div class="k">${esc(label)}</div><div class="v">${fmtCount(v, this._loc())}</div></div></div>`;
  }

  _tiles(stats, group) {
    const tiles = stats.filter(([k]) => group.s[k]).map(([k, label, icon, cls]) => this._tile(group.s[k], this._t(label), icon, cls));
    return tiles.length ? `<div class="tiles">${tiles.join("")}</div>` : "";
  }

  _link(url) {
    const u = safeUrl(url);
    const title = esc(this._t("open_github"));
    return u ? `<a class="link" href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="${title}" aria-label="${title}">${svgIcon(ICONS.open)}</a>` : "";
  }

  /**
   * No repository to show: the GitHub integration follows none (only the account), or none of those of the
   * `repositories` option. Says which, with a button that opens the integration's page to add some.
   */
  _empty() {
    const filtered = discover(this._hass).repos.length > 0;
    return `<div class="empty">${svgIcon(ICONS.github)}<div>
        <div class="t">${esc(this._t("no_repos"))}</div>
        <div class="h">${esc(this._t(filtered ? "no_match" : "no_repos_hint"))}</div>
        <button class="action" data-action="integration">${svgIcon(ICONS.open)}${esc(this._t("open_integration"))}</button>
      </div></div>`;
  }

  /** The illustration's styles, only when it is shown. */
  _bannerStyle() {
    return this._config.illustration === false ? "" : BANNER_STYLE;
  }

  _noGh() {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t("no_github"))}</div></ha-card>`;
  }
}

/** Full card: every repository as a foldable section (counters and latest activity), then the account. */
export class GitHubCard extends GitHubBase {
  static getConfigElement() {
    return document.createElement("github-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 2 + this._repoCount() * 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _repoCount() {
    return this._hass && this._config ? this._repos().length : 3;
  }

  _render() {
    const repos = this._repos();
    // `embed` (to place the blocks inside another card or a stack): only the counters and the latest activity of the repositories,
    // and the account section, without the card's frame, header or foldable sections.
    if (this._config.embed) {
      // The repositories listed in `repositories` (none without it), then the account unless `show_account: false`.
      const shown = (this._config.repositories || []).length ? repos : [];
      const body = shown.map((r) => `${this._tiles(REPO_STATS, r)}${this._config.show_latest === false ? "" : this._latest(r)}`);
      body.push(...this._users().map((u) => this._accountSection(u)));
      return body.some(Boolean) ? `<style>${BASE_STYLE}${FULL_STYLE}</style><div class="content embed">${body.join("")}</div>` : "";
    }
    const users = this._users();
    if (!repos.length && !users.length) return this._noGh();
    // A single repository is always unfolded; otherwise one at a time, folded on a click elsewhere.
    const single = repos.length === 1;
    const sections = repos.length ? repos.map((r) => this._repoSection(r, single)) : [this._empty()];
    for (const u of users) sections.push(this._accountSection(u));
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._bannerStyle()}</style>
      <ha-card>
        ${this._header(repos, this._aside?.() || "")}
        <div class="content">${sections.join("")}</div>
      </ha-card>`;
  }

  _repoSection(r, single) {
    const open = single || this._openRepo === r.id;
    const count = (key, icon, cls) => {
      if (!r.s[key]) return "";
      const v = this._num(r.s[key]);
      return `<span class="c-${cls} ${cls}" title="${esc(`${this._t(REPO_STATS.find(([k]) => k === key)[1])}: ${fmtFull(v, this._loc())}`)}">${svgIcon(icon)}${fmtCount(v, this._loc())}</span>`;
    };
    const toggle = single ? "" : ` toggle${open ? "" : " closed"}" data-action="repo" data-target="${esc(r.id)}" role="button" tabindex="0" aria-expanded="${open}`;
    const head = `<div class="repo-head${toggle}">
        ${svgIcon(ICONS.code)}<span class="repo-name" title="${esc(r.label)}">${esc(r.label)}</span>
        <span class="counts">${count("stargazers_count", ICONS.star, "star")}${count("issues_count", ICONS.issue, "issue")}${count("pulls_count", ICONS.pr, "pr")}</span>
        ${this._link(r.url)}${single ? "" : svgIcon(ICONS.chevron, "chevron")}
      </div>`;
    if (!open) return `<div class="repo">${head}</div>`;
    const latest = this._config.show_latest === false ? "" : this._latest(r);
    return `<div class="repo">${head}<div class="repo-body">${this._tiles(REPO_STATS, r)}${latest}</div></div>`;
  }

  /** Latest release, tag, commit, pull request, issue and discussion, each opening its page on GitHub. */
  _latest(r) {
    const rows = REPO_LATEST.filter(([k]) => r.s[k]).map(([k, icon]) => {
      const s = this._s(r.s[k]);
      const a = s?.attributes || {};
      const unknown = isUnknown(s);
      let value = unknown ? "—" : esc(String(s.state).split("\n")[0]);
      if (!unknown && k === "latest_commit" && a.sha) value += `<small>${esc(String(a.sha).slice(0, 7))}</small>`;
      if (!unknown && a.number !== undefined) value += `<small>#${esc(a.number)}</small>`;
      if (!unknown && k === "latest_release" && a.tag && a.tag !== s.state) value += `<small>${esc(a.tag)}</small>`;
      const label = esc(this._t(k));
      return `<div class="row clickable" data-entity="${esc(r.s[k])}" role="button" tabindex="0" title="${label}">
          ${svgIcon(icon)}<span class="k">${label}</span><span class="v">${value}</span>${unknown ? "" : this._link(a.url)}
        </div>`;
    });
    return rows.length ? `<div class="latest">${rows.join("")}</div>` : "";
  }

  _accountSection(u) {
    const tiles = this._tiles(USER_STATS, u);
    if (!tiles) return "";
    return `<div>
        <div class="section-title">${svgIcon(ICONS.account)}<span class="label" title="${esc(u.label)}">${esc(this._t("account"))} · ${esc(u.label)}</span>${this._link(u.url)}</div>
        ${tiles}
      </div>`;
  }
}

/**
 * Compact card: total stars, forks, issues and pull requests, then one line per repository. Its zoom button (top
 * right, `zoom: false` removes it) switches it to the full card and back; a click outside the card brings the compact
 * view back. A click on a repository shows the full card with that repository unfolded.
 */
export class GitHubMiniCard extends GitHubCard {
  static getConfigElement() {
    return document.createElement("github-mini-card-editor");
  }

  constructor() {
    super();
    this._unzoom = watchOutside(
      (ev) => !ev.composedPath().includes(this) && !inDialog(ev),
      () => {
        if (this._zoomed) this._setZoom(false);
      },
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this._unzoom.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed, repo = null) {
    this._zoomed = zoomed;
    this._openRepo = zoomed ? repo : null;
    this._update();
  }

  _action(action, target, ev) {
    if (action === "zoom") {
      ev.stopPropagation();
      this._setZoom(!this._zoomed);
      // Keyboard use (no click count) keeps the focus on the button that replaced this one.
      if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
      return;
    }
    if (action === "show") return this._setZoom(true, target || null);
    super._action(action, target, ev);
  }

  _aside() {
    if (this._config.zoom === false) return "";
    const title = esc(this._t(this._zoomed ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${title}" aria-label="${title}">${svgIcon(this._zoomed ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _render() {
    return this._zoomed ? super._render() : this._compactRender();
  }

  _compactRender() {
    const repos = this._repos();
    const users = this._users();
    if (!repos.length && !users.length) return this._noGh();
    const c = this._config;
    const loc = this._loc();
    const total = (key, label, icon, cls) => {
      const v = this._sum(repos, key);
      if (v === null) return "";
      const title = `${this._t(label)}: ${fmtFull(v, loc)}`;
      return `<div class="tile ${cls}" title="${esc(title)}" aria-label="${esc(title)}">${svgIcon(icon)}<div><div class="k">${esc(this._t(label))}</div><div class="v">${fmtCount(v, loc)}</div></div></div>`;
    };
    const totals = [
      total("stargazers_count", "stars", ICONS.star, "star"),
      total("forks_count", "forks", ICONS.fork, "fork"),
      total("issues_count", "issues", ICONS.issue, "issue"),
      total("pulls_count", "pulls", ICONS.pr, "pr"),
    ].join("");
    const max = Math.max(1, Number.parseInt(c.max_repos, 10) || 5);
    const zoom = c.zoom !== false;
    const cell = (r, key, icon, cls) => `<span class="${cls}">${r.s[key] ? `${svgIcon(icon)}${fmtCount(this._num(r.s[key]), loc)}` : ""}</span>`;
    const items = repos.slice(0, max).map((r) => {
      // With the zoom button, a repository opens the full card on it; without, the more-info of its stars.
      const target = zoom ? `data-action="show" data-target="${esc(r.id)}"` : `data-entity="${esc(r.s.stargazers_count || Object.values(r.s)[0])}"`;
      return `<div class="item clickable" ${target} role="button" tabindex="0" title="${esc(r.label)}">
          <span class="n">${esc(r.label)}</span>${cell(r, "stargazers_count", ICONS.star, "star")}${cell(r, "issues_count", ICONS.issue, "issue")}${cell(r, "pulls_count", ICONS.pr, "pr")}
        </div>`;
    });
    if (repos.length > max)
      items.push(`<div class="item more${zoom ? ' clickable" data-action="show" role="button" tabindex="0' : ""}"><span class="n">+${repos.length - max}</span></div>`);
    const st = this._status(repos);
    // Without a repository, the message above already says so: no status in the footer.
    const foot = repos.length ? [`<span class="${st.cls}"><span class="dot"></span>${esc(st.text)}</span>`] : [];
    for (const u of users) {
      const v = this._num(u.s.followers);
      if (u.s.followers)
        foot.push(`<span class="clickable" data-entity="${esc(u.s.followers)}" role="button" tabindex="0" title="${esc(`${u.label} · ${this._t("followers")}: ${fmtFull(v, loc)}`)}">${svgIcon(ICONS.group)}${fmtCount(v, loc)}</span>`);
    }
    return `<style>${BASE_STYLE}${MINI_STYLE}${this._bannerStyle()}</style>
      <ha-card>
        ${this._header(repos, this._aside())}
        <div class="content">
          ${repos.length ? "" : this._empty()}
          ${totals ? `<div class="tiles">${totals}</div>` : ""}
          ${items.length ? `<div class="list">${items.join("")}</div>` : ""}
          <div class="foot">${foot.join("")}</div>
        </div>
      </ha-card>`;
  }
}
