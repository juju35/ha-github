/*
 * GitHub panel for Home Assistant (administrators only)
 * https://github.com/juju35/ha-github
 *
 * Five tabs under the toolbar, as in Smart Comfort and IPTV (text tabs, the active one underlined, the tab in the
 * address, Settings last):
 * - Repositories: the repositories of your GitHub account (and your starred ones, if chosen), followed or not by the
 *   core GitHub integration; follow or stop following one, the ticked ones or all of them at once (one reload of the GitHub
 *   integration for the whole change), through the github_card/* WebSocket commands. Each followed repository shows
 *   its live counters and unfolds the GitHub Card's details; the head gives the totals (stars, open issues and pull
 *   requests), the GitHub account (followers…) closes the list;
 * - Issues and Pull requests: the open ones of the followed repositories, most recently updated first, from the
 *   GitHub API (github_card/items, cached 5 minutes by the integration; Refresh asks GitHub again);
 * - My pull requests: the open pull requests of the GitHub account, in any repository (followed or not), from a
 *   search made with the same query;
 * - Settings: which repositories are offered (name patterns, starred ones, archived ones ignored) and the new issue / pull request
 *   notifications.
 */

const GITHUB_PANEL_VERSION = "2.9.1";
// No Activity tab since 2.3.0: the Repositories tab shows the same; /github-config/activity opens Repositories.
const GITHUB_PANEL_TABS = ["repos", "issues", "pulls", "mine", "settings"];
// The tabs listing items (open issues and pull requests), rendered together when the items change
const GITHUB_PANEL_ITEM_TABS = ["issues", "pulls", "mine"];
// Bounds of the items refresh interval, in minutes (kept in step with const.py)
const GITHUB_PANEL_MIN_REFRESH = 1;
const GITHUB_PANEL_MAX_REFRESH = 1440;
// Orders of the Repositories tab (see GitHubPanel._rows)
const GITHUB_PANEL_SORTS = ["followed", "name", "stars", "issues", "pulls"];

// Translations: one file per language, frontend/i18n/<lang>.json (its "panel" section), served by the integration
// and loaded when the panel opens, with English as the fallback (the tests check that every file has the keys of
// en.json).
const GITHUB_PANEL_I18N_URL = "/github_card/i18n";
// The languages that have a file
const GITHUB_PANEL_LANGUAGES = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
// Strings by language, filled as their files come in; the loads under way
const GITHUB_PANEL_STRINGS = {};
const githubPanelLoads = {};

/** The strings of a language: from its file, or set directly by the tests and the screenshots. */
function githubPanelAddStrings(code, strings) {
  GITHUB_PANEL_STRINGS[code] = strings || {};
}

/** Loads the file of a language once; a failed load leaves it empty, so English shows. */
function githubPanelLoadStrings(code) {
  if (!githubPanelLoads[code]) {
    const url = `${GITHUB_PANEL_I18N_URL}/${code}.json?v=${GITHUB_PANEL_VERSION}`;
    githubPanelLoads[code] = fetch(url)
      .then((response) => (response.ok ? response.json() : {}))
      .then((file) => githubPanelAddStrings(code, file.panel))
      .catch(() => githubPanelAddStrings(code, {}));
  }
  return githubPanelLoads[code];
}

const githubPanelEsc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// mdi paths used by the panel (ha-icon is avoided so that the screenshots and tests need no frontend)
const GITHUB_PANEL_ICONS = {
  code: "M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z",
  open: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  cog: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  issue: "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5Z",
  pr: "M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V15.17C8.17,15.58 9,16.69 9,18A3,3 0 0,1 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M21,18A3,3 0 0,1 18,21A3,3 0 0,1 15,18C15,16.69 15.83,15.58 17,15.17V7H15V10.25L10.75,6L15,1.75V5H17A2,2 0 0,1 19,7V15.17C20.17,15.58 21,16.69 21,18M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17Z",
  chevron: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  star: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z",
  tag: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  comment: "M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
};
const githubPanelIcon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${GITHUB_PANEL_ICONS[name]}"/></svg>`;

class GitHubPanel extends HTMLElement {
  static STYLE = `
    :host { display:block; min-height:100%; background:var(--primary-background-color); color:var(--primary-text-color);
            --gh-accent:#8957e5; --tone-good:var(--success-color, #43a047); --tone-warn:var(--warning-color, #ffa600); --tone-bad:var(--error-color, #db4437); }
    .i { width:18px; height:18px; fill:currentColor; flex:none; }
    .toolbar { height:var(--header-height, 56px); display:flex; align-items:center; gap:8px; padding:0 12px; box-sizing:border-box;
               background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, #fff);
               border-bottom:var(--app-header-border-bottom, none); font-size:20px; position:sticky; top:0; z-index:2; }
    .toolbar .grow { flex:1; }
    .toolbar a { color:inherit; display:flex; padding:8px; border-radius:50%; }
    .toolbar a .i { width:22px; height:22px; }
    .toolbar a:hover { background:rgba(255,255,255,.12); }
    /* Tabs under the toolbar, as in Smart Comfort: text, the active one underlined, sticky with the toolbar */
    .tabs { display:flex; gap:4px; padding:0 12px; overflow-x:auto; background:var(--app-header-background-color, var(--primary-color));
            position:sticky; top:var(--header-height, 56px); z-index:2; }
    .tab { background:none; border:none; border-bottom:2px solid transparent; color:var(--app-header-text-color, #fff); opacity:.75;
           padding:12px 14px; font:inherit; font-size:14px; cursor:pointer; white-space:nowrap; }
    .tab:hover, .tab:focus-visible { opacity:1; outline:none; }
    .tab.active { opacity:1; border-bottom-color:var(--app-header-text-color, #fff); }
    /* Count badge on the Issues and Pull requests tabs */
    .tab .badge { display:inline-block; margin-inline-start:6px; min-width:18px; padding:0 5px; border-radius:9px; font-size:12px;
                  line-height:18px; text-align:center; font-weight:600; vertical-align:middle;
                  background:var(--app-header-text-color, #fff); color:var(--app-header-background-color, var(--primary-color)); }
    main { max-width:1040px; margin:0 auto; padding:16px; box-sizing:border-box; }
    section[hidden] { display:none; }
    .box { background:var(--card-background-color, #fff); border-radius:var(--ha-card-border-radius, 12px);
           border:1px solid var(--divider-color, rgba(127,127,127,.2)); padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
    .note { font-size:14px; color:var(--secondary-text-color); }
    .note.warn { color:color-mix(in srgb, var(--tone-warn) 50%, var(--primary-text-color)); }
    .note.bad { color:color-mix(in srgb, var(--tone-bad) 50%, var(--primary-text-color)); }
    .note.good { color:color-mix(in srgb, var(--tone-good) 50%, var(--primary-text-color)); }
    .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .head .sum { flex:1 1 160px; font-size:14px; color:var(--secondary-text-color); }
    .search { flex:1 1 160px; display:flex; align-items:center; border-radius:8px; border:1px solid var(--divider-color, rgba(127,127,127,.3));
              background:var(--secondary-background-color, rgba(127,127,127,.08)); }
    .search:focus-within, .field:focus-within { border-color:var(--gh-accent); }
    .search input, .field input { flex:1; min-width:0; border:0; outline:0; background:none; color:inherit; font:inherit; font-size:14px; padding:8px 10px; }
    /* Buttons: outlined or tinted, never filled */
    .act { display:inline-flex; align-items:center; gap:6px; cursor:pointer; font:inherit; font-size:13px; font-weight:500; padding:6px 12px;
           border-radius:16px; color:var(--gh-accent); background:none; border:1px solid color-mix(in srgb, var(--gh-accent) 50%, transparent); white-space:nowrap; }
    .act .i { width:16px; height:16px; }
    .act:hover:not([disabled]) { background:color-mix(in srgb, var(--gh-accent) 12%, transparent); }
    .act.quiet { color:var(--secondary-text-color); border-color:var(--divider-color, rgba(127,127,127,.3)); }
    .act.bad { color:color-mix(in srgb, var(--tone-bad) 50%, var(--primary-text-color)); border-color:color-mix(in srgb, var(--tone-bad) 45%, transparent); }
    .act[disabled] { opacity:.5; cursor:default; }
    .act:focus-visible, .tab:focus-visible, a:focus-visible, input:focus-visible { outline:2px solid var(--gh-accent); outline-offset:1px; }
    .list { display:flex; flex-direction:column; }
    .row { display:flex; align-items:center; gap:10px; padding:8px 0; border-top:1px solid var(--divider-color, rgba(127,127,127,.15)); min-height:36px; }
    .row:first-child { border-top:0; }
    .row > .i { color:var(--secondary-text-color); }
    .row .n { flex:1; min-width:0; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .row .chip { font-size:11px; font-weight:500; padding:2px 8px; border-radius:12px; flex:none;
                 color:color-mix(in srgb, var(--tone-good) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-good) 15%, transparent); }
    .row .chip { display:inline-flex; align-items:center; gap:3px; }
    /* Same width for Follow and Stop following, so the links line up */
    .row > .act { min-width:9.5em; justify-content:center; }
    .row .chip .i { width:12px; height:12px; }
    .row .pick-repo { appearance:none; width:18px; height:18px; margin:0; flex:none; cursor:pointer; border-radius:4px; display:grid; place-items:center;
           border:2px solid var(--secondary-text-color); background:none; }
    .row .pick-repo:checked { border-color:var(--gh-accent); background:var(--gh-accent); }
    .row .pick-repo:checked::after { content:""; width:5px; height:9px; margin-top:-2px; border:solid var(--card-background-color, #fff); border-width:0 2px 2px 0; transform:rotate(45deg); }
    .row .pick-repo[disabled] { opacity:.5; cursor:default; }
    .row .link { display:grid; place-items:center; width:28px; height:28px; border-radius:50%; color:var(--secondary-text-color); flex:none; }
    .row .link:hover { background:color-mix(in srgb, var(--secondary-text-color) 15%, transparent); }
    .row .link .i { width:16px; height:16px; }
    /* A followed repository: its name folds and unfolds the card's details (chevron right folded, down unfolded) */
    .fold { all:unset; flex:1; min-width:0; display:flex; align-items:center; gap:8px; cursor:pointer; border-radius:6px; }
    .fold:focus-visible { outline:2px solid var(--gh-accent); outline-offset:2px; }
    .fold > .i { color:var(--secondary-text-color); transition:transform .15s; }
    .row.open .fold > .i { transform:rotate(90deg); }
    .totals { display:flex; align-items:center; gap:12px; margin-top:2px; }
    .totals:empty { display:none; }
    .totals > span { display:inline-flex; align-items:center; gap:3px; }
    .totals .i { width:14px; height:14px; color:#e3a008; }
    .account-slot.on { border-top:1px solid var(--divider-color, rgba(127,127,127,.15)); padding-top:8px; }
    .info { display:inline-flex; align-items:center; gap:10px; font-size:12px; color:var(--secondary-text-color); flex:none; }
    .info > span { display:inline-flex; align-items:center; gap:3px; }
    .info .i { width:14px; height:14px; }
    .info .star .i { color:#e3a008; } .info .ok .i { color:var(--tone-good); } .info .tag .i { color:var(--gh-accent); }
    .detail { padding:4px 0 12px 26px; }
    @media (max-width: 600px) { .info .tag, .info .ok:nth-child(3) { display:none; } .detail { padding-left:0; } }
    /* Confirmation in place of the row, like the card popups (at the top of what they act on) */
    .confirm { flex-direction:column; align-items:stretch; gap:8px; padding:10px 12px; margin:4px 0; border-radius:10px;
               border:1px solid color-mix(in srgb, var(--tone-bad) 45%, transparent); background:color-mix(in srgb, var(--tone-bad) 8%, transparent); }
    .confirm .b { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
    /* Narrow (phone): the name keeps the line, the chip goes */
    @media (max-width: 420px) { .row .chip { display:none; } }
    .form { display:flex; flex-direction:column; gap:14px; }
    .ctl { display:flex; flex-direction:column; gap:4px; }
    .ctl > span { font-size:12px; color:var(--secondary-text-color); }
    .ctl small, .toggle small { font-size:11px; color:var(--secondary-text-color); }
    .field { display:flex; border-radius:8px; border:1px solid var(--divider-color, rgba(127,127,127,.3)); background:var(--secondary-background-color, rgba(127,127,127,.08)); }
    .toggle { display:flex; align-items:center; gap:12px; cursor:pointer; }
    .toggle > div { flex:1; display:flex; flex-direction:column; gap:2px; font-size:14px; }
    .toggle input { width:18px; height:18px; accent-color:var(--gh-accent); }
    .bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    /* Issues and pull requests: one line per item, its repository, number, author and age under the title */
    .head .pick[data-sort] { flex:0 0 auto; }
    .pick { flex:0 1 240px; min-width:0; border-radius:8px; border:1px solid var(--divider-color, rgba(127,127,127,.3)); padding:7px 8px;
            background:var(--secondary-background-color, rgba(127,127,127,.08)); color:inherit; font:inherit; font-size:14px; }
    .item { display:flex; gap:10px; align-items:flex-start; padding:10px 0; border-top:1px solid var(--divider-color, rgba(127,127,127,.15));
            color:inherit; text-decoration:none; }
    .item:first-child { border-top:0; }
    .item:hover .t { color:var(--gh-accent); }
    .item > .i { margin-top:2px; color:var(--tone-good); }
    .item.draft > .i { color:var(--secondary-text-color); }
    .item .body { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
    .item .t { font-size:14px; font-weight:500; overflow-wrap:anywhere; }
    .item .m { font-size:12px; color:var(--secondary-text-color); display:flex; flex-wrap:wrap; gap:4px 10px; align-items:center; }
    .item .m .i { width:14px; height:14px; }
    .item .m span { display:inline-flex; align-items:center; gap:3px; }
    .lbl { font-size:11px; font-weight:500; padding:1px 8px; border-radius:10px; border:1px solid color-mix(in srgb, var(--c) 60%, transparent);
           color:color-mix(in srgb, var(--c) 55%, var(--primary-text-color)); background:color-mix(in srgb, var(--c) 14%, transparent); }
    .rev { font-size:11px; font-weight:500; padding:1px 8px; border-radius:10px; }
    .rev.good { color:color-mix(in srgb, var(--tone-good) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-good) 15%, transparent); }
    .rev.warn { color:color-mix(in srgb, var(--tone-warn) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-warn) 15%, transparent); }
    .rev.bad { color:color-mix(in srgb, var(--tone-bad) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-bad) 15%, transparent); }
    .rev.muted { color:var(--secondary-text-color); background:var(--secondary-background-color, rgba(127,127,127,.12)); }
  `;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "repos";
    this._overview = null;
    this._settings = null;
    this._draft = {};
    this._query = "";
    this._busy = false;
    this._message = null; // { tone, text }
    this._confirm = null; // repository whose unfollowing is being confirmed
    this._selected = new Set(); // repositories not followed yet, ticked to follow them together
    this._items = null; // open issues and pull requests, loaded with the first of their tabs
    this._itemsBusy = false;
    this._itemRepo = ""; // repository filter of the Issues and Pull requests tabs
    this._mineRepo = ""; // repository filter of the My pull requests tab
    this._sort = "followed"; // order of the Repositories tab
    try {
      const saved = localStorage.getItem("github_card.repos_sort");
      if (GITHUB_PANEL_SORTS.includes(saved)) this._sort = saved;
    } catch (_err) {
      // no storage: the default order
    }
  }

  // /github-config/<tab> opens that tab (Home Assistant sets the route; the base address is Repositories)
  set route(route) {
    const path = (route?.path || "").split("/").filter(Boolean)[0];
    const tab = GITHUB_PANEL_TABS.includes(path) ? path : "repos";
    if (tab !== this._tab) this._showTab(tab);
  }

  set panel(panel) {
    this._panel = panel;
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
  }

  set hass(hass) {
    const first = !this._hass;
    const before = this._lang();
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (!first) this._updateInfo();
    if (first) this._start();
    else if (this._lang() !== before) this._withStrings();
  }

  connectedCallback() {
    if (this._hass && !this._unsub) this._subscribe();
    this._watchConnection(true);
    // Back on the panel after a failed load: try again now.
    if (this._hass && this._failed) this._reload();
  }

  disconnectedCallback() {
    this._watchConnection(false);
    clearTimeout(this._retryTimer);
    if (this._unsub) {
      this._unsub.then((off) => off()).catch(() => {});
      this._unsub = null;
    }
    if (this._itemsUnsub) {
      this._itemsUnsub.then((off) => off()).catch(() => {});
      this._itemsUnsub = null;
    }
  }


  // The connection back (Home Assistant restarted, the app resumed): load again, the data may have changed meanwhile.
  _watchConnection(on) {
    const connection = this._hass?.connection;
    if (!connection?.addEventListener) return;
    this._onReady ||= () => this._reload();
    connection.removeEventListener("ready", this._onReady);
    if (on) connection.addEventListener("ready", this._onReady);
  }

  // A load that failed (Home Assistant still starting, the connection dropped) is tried again after 2 s, 5 s, 15 s,
  // then every 30 s while the panel is shown, instead of leaving it empty.
  _retry(failed) {
    clearTimeout(this._retryTimer);
    this._failed = failed;
    if (!failed) {
      this._retries = 0;
      return;
    }
    const delay = [2000, 5000, 15000, 30000][Math.min(this._retries || 0, 3)];
    this._retries = (this._retries || 0) + 1;
    this._retryTimer = setTimeout(() => {
      if (this.isConnected) this._reload();
    }, delay);
  }

  async _reload() {
    this._loadFailed = false;
    await Promise.all([this._loadSettings(), this._load()]);
    // One retry for the lot, whichever failed
    this._retry(this._loadFailed);
  }
  // Full code when it has a file (sr-Latn), else its base (de-AT → de), else English
  _lang() {
    const code = this._hass?.language || "en";
    if (GITHUB_PANEL_LANGUAGES.includes(code)) return code;
    const base = code.split("-")[0];
    return GITHUB_PANEL_LANGUAGES.includes(base) ? base : "en";
  }

  // The panel drawn in its language: at once when its strings (and English, the fallback) are in, else once loaded.
  _withStrings() {
    const code = this._lang();
    if (GITHUB_PANEL_STRINGS[code] && GITHUB_PANEL_STRINGS.en) {
      this._render();
      return;
    }
    Promise.all([githubPanelLoadStrings("en"), githubPanelLoadStrings(code)]).then(() => {
      if (this._lang() === code) this._render();
    });
  }

  _t(key, vars = {}) {
    let text = GITHUB_PANEL_STRINGS[this._lang()]?.[key] ?? GITHUB_PANEL_STRINGS.en?.[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
    return text;
  }

  // The data and the card (only the account and the unfolded repository use it) load side by side: waiting for the
  // card first held the whole panel empty until its bundle and its language file were in.
  async _start() {
    this._withStrings();
    this._subscribe();
    this._watchConnection(this.isConnected);
    const version = this._panel?.config?.version || GITHUB_PANEL_VERSION;
    const card = customElements.get("github-card")
      ? null
      : import(`/github_card/github-card.js?v=${version}`)
          .then(() => customElements.whenDefined("github-card"))
          .then(() => {
            if (this._overview) this._renderRepos();
          })
          .catch((err) => console.error("GitHub panel: could not load the card", err));
    await Promise.all([this._reload(), card]);
  }

  // Reload the list when the GitHub integration changes (a repository followed elsewhere, a reload)
  _subscribe() {
    if (this._unsub || !this._hass?.connection) return;
    this._unsub = this._hass.connection
      .subscribeMessage(
        (events) => {
          if (!this._busy && [].concat(events || []).some((ev) => ev?.entry?.domain === "github")) this._load();
        },
        { type: "config_entries/subscribe" },
      )
      .catch(() => () => {});
    this._subscribeItems();
  }

  // The open issues and pull requests: pushed by the background poller (the current snapshot at once, then after
  // each fetch), so the panel shows them without ever querying GitHub when a tab opens.
  _subscribeItems() {
    if (this._itemsUnsub || !this._hass?.connection) return;
    this._itemsUnsub = this._hass.connection
      .subscribeMessage(
        (items) => {
          this._items = items;
          this._itemsBusy = false;
          this._renderItemTabs();
          this._updateTabBadges();
        },
        { type: "github_card/subscribe_items" },
      )
      .catch(() => () => {});
  }

  async _load() {
    try {
      this._overview = await this._hass.callWS({ type: "github_card/repositories" });
      // The error of a failed load goes once a load succeeds (a retry, the connection back).
      if (this._message && this._message === this._loadError) this._message = null;
    } catch (err) {
      this._message = { tone: "bad", text: this._t("error", { error: err?.message || err }) };
      this._loadError = this._message;
      this._overview = this._overview || { configured: true, followed: [], offered: [], offered_error: true };
      this._loadFailed = true;
    }
    this._renderRepos();
  }

  async _loadSettings() {
    try {
      this._settings = (await this._hass.callWS({ type: "github_card/settings" })).settings;
    } catch (_err) {
      this._settings = this._settings || { filter: "", include_starred: false, ignore_archived: false, notify_issues: false, notify_pulls: false, notify_releases: false, refresh_minutes: 15 };
      this._loadFailed = true;
    }
    this._renderSettings();
  }

  // ── Tabs ──

  _goTab(tab, focus) {
    if (!GITHUB_PANEL_TABS.includes(tab)) return;
    this._showTab(tab, focus);
    const base = (this._panel?.url_path || "github-config").replace(/^\//, "");
    try {
      history.replaceState(history.state, "", `/${base}${tab === "repos" ? "" : `/${tab}`}`);
    } catch (_err) {
      // no history (a test, a sandboxed page): the tab still shows
    }
  }

  _showTab(tab, focus) {
    this._tab = tab;
    const root = this.shadowRoot;
    for (const button of root.querySelectorAll?.(".tab") || []) {
      const selected = button.dataset.tab === tab;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus({ preventScroll: true });
    }
    for (const name of GITHUB_PANEL_TABS) {
      const section = root.getElementById?.(`tab-${name}`);
      if (section) section.hidden = name !== tab;
    }
    // The issues and pull requests are not fetched when their tab opens: a background poller fetches them on its
    // interval and pushes them here (see _subscribeItems).
  }

  _render() {
    const root = this.shadowRoot;
    const tabs = GITHUB_PANEL_TABS.map((tab) => {
      const selected = tab === this._tab;
      const count = this._tabCount(tab);
      const badge = count ? `<span class="badge" aria-hidden="true">${count}</span>` : "";
      return `<button class="tab${selected ? " active" : ""}" role="tab" id="tabbtn-${tab}" data-tab="${tab}" aria-selected="${selected}" aria-controls="tab-${tab}" tabindex="${selected ? 0 : -1}">${githubPanelEsc(this._t(tab))}${badge}</button>`;
    }).join("");
    root.innerHTML = `
      <style>${GitHubPanel.STYLE}</style>
      <div class="toolbar">
        <ha-menu-button></ha-menu-button>
        <span class="grow">${githubPanelEsc(this._t("title"))}</span>
        <a href="/config/integrations/integration/github" title="${githubPanelEsc(this._t("open_integration"))}" aria-label="${githubPanelEsc(this._t("open_integration"))}">${githubPanelIcon("cog")}</a>
      </div>
      <div class="tabs" role="tablist">${tabs}</div>
      <main>
        <section id="tab-repos" role="tabpanel" aria-labelledby="tabbtn-repos"><div id="repos"></div></section>
        <section id="tab-issues" role="tabpanel" aria-labelledby="tabbtn-issues"><div id="issues"></div></section>
        <section id="tab-pulls" role="tabpanel" aria-labelledby="tabbtn-pulls"><div id="pulls"></div></section>
        <section id="tab-mine" role="tabpanel" aria-labelledby="tabbtn-mine"><div id="mine"></div></section>
        <section id="tab-settings" role="tabpanel" aria-labelledby="tabbtn-settings"><div id="settings"></div></section>
      </main>`;
    this._menu = root.querySelector("ha-menu-button");
    if (this._menu) {
      this._menu.hass = this._hass;
      this._menu.narrow = this._narrow;
    }
    for (const button of root.querySelectorAll(".tab")) {
      button.addEventListener("click", () => this._goTab(button.dataset.tab));
      // Left and right arrows move between the tabs, as in a native tab bar
      button.addEventListener("keydown", (ev) => {
        const step = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        ev.preventDefault();
        const i = GITHUB_PANEL_TABS.indexOf(this._tab);
        this._goTab(GITHUB_PANEL_TABS[(i + step + GITHUB_PANEL_TABS.length) % GITHUB_PANEL_TABS.length], true);
      });
    }
    this._showTab(this._tab);
    this._renderRepos();
    this._renderItemTabs();
    this._renderSettings();
  }

  // ── Repositories tab ──

  /** Rows to show: followed and offered repositories matching the search, followed first, then by name. */
  /**
   * Rows to show: followed and offered repositories matching the search, in the chosen order. `followed` (the
   * default): followed first, then by name; `name`: all by name; `stars`, `issues`, `pulls`: the followed ones by
   * that live counter (highest first), then the others by name, which have no counter.
   */
  _rows() {
    const o = this._overview;
    const q = this._query.trim().toLowerCase();
    const rows = [...o.followed.map((name) => ({ name, followed: true })), ...o.offered.map((name) => ({ name, followed: false }))]
      .filter((r) => !q || r.name.toLowerCase().includes(q));
    const byName = (a, b) => a.name.localeCompare(b.name);
    const key = { stars: "stargazers_count", issues: "issues_count", pulls: "pulls_count" }[this._sort];
    if (this._sort === "name") return rows.sort(byName);
    if (key) {
      const n = (r) => (r.followed ? this._number(r.name, key) : null) ?? -1;
      return rows.sort((a, b) => n(b) - n(a) || Number(b.followed) - Number(a.followed) || byName(a, b));
    }
    return rows.sort((a, b) => Number(b.followed) - Number(a.followed) || byName(a, b));
  }

  /** A live counter of a followed repository (its GitHub sensor), or null. */
  _number(repo, key) {
    const s = this._hass?.states?.[this._overview?.sensors?.[repo]?.[key]];
    const v = Number(s?.state);
    return s && s.state !== "" && Number.isFinite(v) ? v : null;
  }

  _renderRepos() {
    const host = this.shadowRoot.getElementById?.("repos");
    if (!host) return;
    const esc = githubPanelEsc;
    const o = this._overview;
    if (!o) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("loading"))}</div></div>`;
      return;
    }
    if (!o.configured) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("no_github"))}</div>
        <div class="bar"><button class="act" data-action="add-github">${githubPanelIcon("plus")}${esc(this._t("add_github"))}</button></div></div>`;
      this._bindRepos(host);
      return;
    }
    const rows = this._rows();
    const toFollow = rows.filter((r) => !r.followed).map((r) => r.name);
    // The selection keeps only repositories still offered (a follow, other settings, another panel)
    for (const name of this._selected) if (!o.offered.includes(name)) this._selected.delete(name);
    const selected = [...this._selected];
    const notes = [];
    if (o.state && o.state !== "loaded") notes.push(`<div class="note warn">${esc(this._t("not_loaded", { state: o.state }))}</div>`);
    if (o.offered_error && o.state === "loaded") notes.push(`<div class="note warn">${esc(this._t("offered_error"))}</div>`);
    if (this._busy) notes.push(`<div class="note" role="status">${esc(this._t("working"))}</div>`);
    else if (this._message) {
      // A failed load: tried again on its own, or at once with Retry.
      const retry = this._message === this._loadError ? ` <button class="act quiet" data-action="retry">${esc(this._t("retry"))}</button>` : "";
      notes.push(`<div class="note ${this._message.tone}" role="status">${esc(this._message.text)}${retry}</div>`);
    }
    const disabled = this._busy ? " disabled" : "";
    const list = rows.map((r) => {
      const link = `<a class="link" href="https://github.com/${esc(r.name)}" target="_blank" rel="noopener noreferrer" title="${esc(this._t("open_github"))}" aria-label="${esc(this._t("open_github"))}">${githubPanelIcon("open")}</a>`;
      if (this._confirm === r.name)
        return `<div class="row confirm"><div class="note">${esc(this._t("confirm_unfollow", { repo: r.name }))}</div>
          <div class="b"><button class="act quiet" data-action="cancel">${esc(this._t("cancel"))}</button>
          <button class="act bad" data-action="unfollow-confirmed" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button></div></div>`;
      const action = r.followed
        ? `<button class="act quiet" data-action="unfollow" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button>`
        : `<button class="act" data-action="follow" data-repo="${esc(r.name)}"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow"))}</button>`;
      if (!r.followed) {
        const label = esc(this._t("select_repo", { repo: r.name }));
        const box = `<input type="checkbox" class="pick-repo" data-repo="${esc(r.name)}" aria-label="${label}" title="${label}"${this._selected.has(r.name) ? " checked" : ""}${disabled}>`;
        return `<div class="row">${box}${githubPanelIcon("code")}<span class="n" title="${esc(r.name)}">${esc(r.name)}</span>${link}${action}</div>`;
      }
      // A followed repository: its name unfolds the GitHub Card's counters and latest activity under the row
      const open = this._expanded === r.name;
      return `<div class="row${open ? " open" : ""}">
          <button class="fold" data-action="expand" data-repo="${esc(r.name)}" aria-expanded="${open}" title="${esc(this._t("details"))}">
            ${githubPanelIcon("chevron")}<span class="n" title="${esc(r.name)}">${esc(r.name)}</span></button>
          <span class="info" data-repo="${esc(r.name)}">${this._infoHtml(r.name)}</span>${link}${action}</div>
        ${open ? `<div class="detail" data-repo="${esc(r.name)}"></div>` : ""}`;
    });
    host.innerHTML = `<div class="box">
        <div class="head">
          <span class="sum">${esc(this._t("summary", { followed: o.followed.length, offered: o.offered.length }))}<span class="totals">${this._totalsHtml()}</span></span>
          <select class="pick" data-sort aria-label="${esc(this._t("sort_label"))}" title="${esc(this._t("sort_label"))}">${GITHUB_PANEL_SORTS.map(
            (v) => `<option value="${v}"${v === this._sort ? " selected" : ""}>${esc(this._t(`sort_${v}`))}</option>`,
          ).join("")}</select>
          <label class="search"><input type="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}" value="${esc(this._query)}"></label>
          ${selected.length ? `<button class="act" data-action="follow-selected"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow_selected", { n: selected.length }))}</button>` : ""}
          ${toFollow.length > 1 ? `<button class="act" data-action="follow-all"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow_all", { n: toFollow.length }))}</button>` : ""}
        </div>
        ${notes.join("")}
        <div class="list">${list.length ? list.join("") : this._message && this._message === this._loadError ? "" : `<div class="note">${esc(this._t("empty"))}</div>`}</div>
        <div class="account-slot"></div>
      </div>`;
    this._bindRepos(host);
    this._mountDetail(host);
    this._mountAccount(host);
  }

  /** Live counters of a followed repository, from its GitHub sensors: stars, open issues, open pull requests, release. */
  _infoHtml(repo) {
    const ids = this._overview?.sensors?.[repo] || {};
    const value = (key) => {
      const s = this._hass?.states?.[ids[key]];
      return s && s.state !== "unavailable" && s.state !== "unknown" ? s.state : null;
    };
    const count = (key, icon, label, cls) => {
      const v = value(key);
      if (v === null) return "";
      const n = Number(v);
      let text = v;
      try {
        text = Number.isFinite(n) ? new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n) : v;
      } catch (_err) {
        // unknown locale: the raw value
      }
      return `<span class="${cls}" title="${githubPanelEsc(`${this._t(label)}: ${v}`)}">${githubPanelIcon(icon)}${githubPanelEsc(text)}</span>`;
    };
    return [
      count("stargazers_count", "star", "stars", "star"),
      count("issues_count", "issue", "issues", "ok"),
      count("pulls_count", "pr", "pulls", "ok"),
      count("latest_release", "tag", "release", "tag"),
    ].join("");
  }

  /** The embedded GitHub Card of the unfolded repository, kept across re-renders (and its hass kept current). */
  _mountDetail(host) {
    const slot = host.querySelector(".detail");
    if (!slot || !customElements.get("github-card")) return;
    const repo = slot.dataset.repo;
    if (this._detail?.repo !== repo) {
      const card = document.createElement("github-card");
      card.setConfig({ embed: true, repositories: [repo], show_account: false });
      this._detail = { repo, card };
    }
    this._detail.card.hass = this._hass;
    slot.appendChild(this._detail.card);
  }

  /** The GitHub account (followers, following, public repositories and gists) under the list: the card's section. */
  _mountAccount(host) {
    const slot = host.querySelector(".account-slot");
    if (!slot || !customElements.get("github-card")) return;
    if (!this._account) {
      this._account = document.createElement("github-card");
      this._account.setConfig({ embed: true });
    }
    this._account.hass = this._hass;
    slot.appendChild(this._account);
    // The separator only when the card shows the account (its sensors are disabled by default)
    slot.classList.toggle("on", !!this._account.shadowRoot?.innerHTML);
  }

  /** Totals of the followed repositories for the head: stars, and open issues and pull requests. */
  _totalsHtml() {
    const sum = (key) => {
      const values = (this._overview?.followed || []).map((r) => this._number(r, key)).filter((v) => v !== null);
      return values.length ? values.reduce((a, b) => a + b, 0) : null;
    };
    const fmt = (n) => {
      try {
        return new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
      } catch (_err) {
        return String(n);
      }
    };
    const stars = sum("stargazers_count");
    const issues = sum("issues_count");
    const pulls = sum("pulls_count");
    const parts = [];
    if (stars !== null) parts.push(`<span title="${githubPanelEsc(`${this._t("stars")}: ${stars}`)}">${githubPanelIcon("star")}${fmt(stars)}</span>`);
    if (issues !== null || pulls !== null)
      parts.push(`<span>${githubPanelEsc(this._t("open_n", { n: fmt((issues || 0) + (pulls || 0)) }))}</span>`);
    return parts.join("");
  }

  /** Counters of the rows follow the sensors without rebuilding the list (the search field keeps its focus). */
  _updateInfo() {
    const totals = this.shadowRoot.querySelector?.("#repos .totals");
    if (totals) {
      const html = this._totalsHtml();
      if (totals.innerHTML !== html) totals.innerHTML = html;
    }
    if (this._account) {
      this._account.hass = this._hass;
      this.shadowRoot.querySelector?.("#repos .account-slot")?.classList.toggle("on", !!this._account.shadowRoot?.innerHTML);
    }
    for (const span of this.shadowRoot.querySelectorAll?.("#repos .info") || []) {
      const html = this._infoHtml(span.dataset.repo);
      if (span.innerHTML !== html) span.innerHTML = html;
    }
    if (this._detail) this._detail.card.hass = this._hass;
  }

  _bindRepos(host) {
    host.querySelector("select[data-sort]")?.addEventListener("change", (ev) => {
      this._sort = GITHUB_PANEL_SORTS.includes(ev.target.value) ? ev.target.value : "followed";
      // Remembered in this browser only, like the panel's other display choices
      try {
        localStorage.setItem("github_card.repos_sort", this._sort);
      } catch (_err) {
        // no storage (private window, blocked site data): the choice lasts until the page is left
      }
      this._renderRepos();
    });
    const input = host.querySelector("input[type=search]");
    input?.addEventListener("input", () => {
      this._query = input.value;
      const at = input.selectionStart;
      this._renderRepos();
      const again = this.shadowRoot.querySelector("#repos input[type=search]");
      again?.focus();
      again?.setSelectionRange(at, at);
    });
    for (const box of host.querySelectorAll("input.pick-repo"))
      box.addEventListener("change", () => {
        if (box.checked) this._selected.add(box.dataset.repo);
        else this._selected.delete(box.dataset.repo);
        this._renderRepos();
      });
    for (const button of host.querySelectorAll("[data-action]"))
      button.addEventListener("click", () => this._repoAction(button.dataset.action, button.dataset.repo));
  }

  _repoAction(action, repo) {
    if (action === "add-github") return this._navigate("/config/integrations/dashboard/add?domain=github");
    if (action === "retry") return this._reload();
    if (action === "follow") return this._follow([repo], []);
    // The ticked repositories, hidden by the search or not, in one command
    if (action === "follow-selected") return this._follow([...this._selected], []);
    if (action === "follow-all")
      return this._follow(
        this._rows()
          .filter((r) => !r.followed)
          .map((r) => r.name),
        [],
      );
    if (action === "unfollow") this._confirm = repo;
    if (action === "cancel") this._confirm = null;
    // One repository unfolded at a time; its name again folds it
    if (action === "expand") this._expanded = this._expanded === repo ? null : repo;
    if (action === "unfollow-confirmed") {
      this._confirm = null;
      return this._follow([], [repo]);
    }
    this._renderRepos();
  }

  /** Follows and unfollows in one command (one reload of the GitHub integration), then lists again. */
  async _follow(add, remove) {
    if (this._busy || (!add.length && !remove.length)) return;
    this._busy = true;
    this._message = null;
    this._renderRepos();
    try {
      const res = await this._hass.callWS({ type: "github_card/follow", add, remove });
      if (!res.ok) this._message = { tone: "bad", text: this._t("error", { error: res.error }) };
      else {
        this._selected.clear();
        const text = [this._t("done", { added: res.added.length, removed: res.removed.length })];
        if (res.skipped.length) text.push(this._t("skipped", { names: res.skipped.join(", ") }));
        this._message = { tone: res.skipped.length ? "warn" : "good", text: text.join(" · ") };
      }
    } catch (err) {
      this._message = { tone: "bad", text: this._t("error", { error: err?.message || err }) };
    }
    this._busy = false;
    // The followed repositories changed: show the items as loading until the background poller (triggered by the
    // follow on the server) pushes the new ones.
    this._items = null;
    this._renderItemTabs();
    this._updateTabBadges();
    await this._load();
  }

  _navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  // ── Issues, Pull requests and My pull requests tabs ──

  /** The three item tabs, rendered together when the items change. */
  _renderItemTabs() {
    for (const kind of GITHUB_PANEL_ITEM_TABS) this._renderItems(kind);
  }

  /**
   * Open issues or pull requests across the followed repositories, or the user's own open pull requests (mine), for
   * the tab badge; null for other tabs or before loading.
   */
  _tabCount(tab) {
    if (!GITHUB_PANEL_ITEM_TABS.includes(tab)) return null;
    if (!this._items || this._items.error) return null;
    if (tab === "mine") return this._items.mine_total || 0;
    return Object.values(this._items.totals || {}).reduce((n, t) => n + (t[tab] || 0), 0);
  }

  /** Refresh the open-count badge on the item tabs, after their items load. */
  _updateTabBadges() {
    const root = this.shadowRoot;
    for (const tab of GITHUB_PANEL_ITEM_TABS) {
      const button = root.getElementById?.(`tabbtn-${tab}`);
      if (!button) continue;
      const count = this._tabCount(tab);
      let badge = button.querySelector(".badge");
      if (count) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "badge";
          badge.setAttribute("aria-hidden", "true");
          button.appendChild(badge);
        }
        badge.textContent = String(count);
      } else if (badge) {
        badge.remove();
      }
    }
  }

  // The Refresh button: query GitHub now (out of the poller's cycle). The fresh items come back both as the
  // result and, because the server dispatches an update, through the items subscription.
  async _refreshItems() {
    this._itemsBusy = true;
    this._renderItemTabs();
    try {
      this._items = await this._hass.callWS({ type: "github_card/items", refresh: true });
    } catch (err) {
      this._items = { issues: [], pulls: [], totals: {}, mine: [], mine_total: 0, error: err?.message || String(err) };
    }
    this._itemsBusy = false;
    this._renderItemTabs();
    this._updateTabBadges();
  }

  /** "3 days ago" in the panel's language. */
  _ago(iso) {
    const seconds = (Date.parse(iso) - Date.now()) / 1000;
    if (!Number.isFinite(seconds)) return "";
    const steps = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    const [unit, size] = steps.find(([, n]) => Math.abs(seconds) >= n) || ["second", 1];
    try {
      return new Intl.RelativeTimeFormat(this._lang(), { numeric: "auto" }).format(Math.round(seconds / size), unit);
    } catch (_err) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(seconds / size), unit);
    }
  }

  _itemHtml(item, kind) {
    const esc = githubPanelEsc;
    const meta = [
      `<span>${esc(item.repo)} #${esc(item.number)}</span>`,
      item.author && kind !== "mine" ? `<span>${esc(this._t("by", { author: item.author }))}</span>` : "",
      item.updated ? `<span title="${esc(item.updated)}">${esc(this._t("updated", { when: this._ago(item.updated) }))}</span>` : "",
      item.comments ? `<span title="${esc(this._t("comments", { n: item.comments }))}">${githubPanelIcon("comment")}${esc(item.comments)}</span>` : "",
    ];
    if (kind !== "issues") {
      const review = item.draft
        ? ["muted", "draft"]
        : { APPROVED: ["good", "approved"], CHANGES_REQUESTED: ["bad", "changes_requested"], REVIEW_REQUIRED: ["warn", "review_required"] }[item.review];
      if (review) meta.push(`<span class="rev ${review[0]}">${esc(this._t(review[1]))}</span>`);
    }
    for (const label of item.labels || []) {
      const color = /^[0-9a-f]{6}$/i.test(label.color) ? `#${label.color}` : "var(--secondary-text-color)";
      meta.push(`<span class="lbl" style="--c:${color}">${esc(label.name)}</span>`);
    }
    const url = /^https:\/\/github\.com\//.test(item.url) ? item.url : `https://github.com/${item.repo}`;
    return `<a class="item${item.draft ? " draft" : ""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
        ${githubPanelIcon(kind === "issues" ? "issue" : "pr")}
        <div class="body"><span class="t">${esc(item.title)}</span><div class="m">${meta.filter(Boolean).join("")}</div></div>
      </a>`;
  }

  _renderItems(kind) {
    const host = this.shadowRoot.getElementById?.(kind);
    if (!host) return;
    const esc = githubPanelEsc;
    const followed = this._overview?.followed || [];
    // Never fetched yet (pending): the background poller has not delivered the first items.
    if (!this._items || this._items.pending) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("loading"))}</div></div>`;
      return;
    }
    const mine = kind === "mine";
    // My pull requests: any repository, followed or not
    if (!mine && this._overview && !followed.length) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("no_followed"))}</div></div>`;
      return;
    }
    // Its own repository filter: the repositories of the user's pull requests are not the followed ones
    const pick = mine ? this._mineRepo : this._itemRepo;
    const all = this._items[kind] || [];
    const items = pick ? all.filter((i) => i.repo === pick) : all;
    let total;
    let repos;
    if (mine) {
      total = pick ? items.length : this._items.mine_total || 0;
      repos = [...new Set(all.map((i) => i.repo))].sort((a, b) => a.localeCompare(b));
    } else {
      const totals = Object.entries(this._items.totals || {}).filter(([repo]) => !pick || repo === pick);
      total = totals.reduce((n, [, t]) => n + (t[kind] || 0), 0);
      repos = [...new Set([...followed, ...Object.keys(this._items.totals || {})])].sort((a, b) => a.localeCompare(b));
    }
    const options = [`<option value="">${esc(this._t("all_repos"))}</option>`]
      .concat(repos.map((r) => `<option value="${esc(r)}"${r === pick ? " selected" : ""}>${esc(r)}</option>`))
      .join("");
    const notes = [];
    if (this._items.error) notes.push(`<div class="note bad" role="status">${esc(this._t("items_error", { error: this._items.error }))}</div>`);
    // More open pull requests than the search returns: only the most recently updated are listed
    if (mine && !pick && (this._items.mine_total || 0) > all.length)
      notes.push(`<div class="note" role="status">${esc(this._t("mine_more", { shown: all.length }))}</div>`);
    host.innerHTML = `<div class="box">
        <div class="head">
          <span class="sum">${esc(this._t("open_n", { n: total }))}</span>
          <select class="pick" aria-label="${esc(this._t("all_repos"))}">${options}</select>
          <button class="act" data-action="refresh"${this._itemsBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}${esc(this._t("refresh"))}</button>
        </div>
        ${notes.join("")}
        <div class="list">${items.length ? items.map((i) => this._itemHtml(i, kind)).join("") : `<div class="note">${esc(this._t({ issues: "no_issues", pulls: "no_pulls", mine: "no_mine" }[kind]))}</div>`}</div>
      </div>`;
    host.querySelector("select")?.addEventListener("change", (ev) => {
      if (mine) {
        this._mineRepo = ev.target.value;
        this._renderItems("mine");
        return;
      }
      this._itemRepo = ev.target.value;
      this._renderItems("issues");
      this._renderItems("pulls");
    });
    host.querySelector("[data-action=refresh]")?.addEventListener("click", () => this._refreshItems());
  }

  // ── Settings tab ──

  _value(key) {
    return key in this._draft ? this._draft[key] : this._settings?.[key];
  }

  _renderSettings() {
    const host = this.shadowRoot.getElementById?.("settings");
    if (!host) return;
    const esc = githubPanelEsc;
    if (!this._settings) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("loading"))}</div></div>`;
      return;
    }
    const toggle = (key, label, hint) => `<label class="toggle"><div><span>${esc(this._t(label))}</span>${hint ? `<small>${esc(this._t(hint))}</small>` : ""}</div>
        <input type="checkbox" data-key="${key}"${this._value(key) ? " checked" : ""}></label>`;
    const changed = Object.keys(this._draft).some((k) => this._draft[k] !== this._settings[k]);
    host.innerHTML = `<div class="box form">
        <label class="ctl"><span>${esc(this._t("s_filter"))}</span>
          <div class="field"><input type="text" data-key="filter" value="${esc(this._value("filter"))}" placeholder="juju35/ha-*" spellcheck="false"></div>
          <small>${esc(this._t("s_filter_hint"))}</small></label>
        ${toggle("include_starred", "s_starred", "s_starred_hint")}
        ${toggle("ignore_archived", "s_archived", "s_archived_hint")}
        ${toggle("notify_issues", "s_notify_issues", "s_notify_hint")}
        ${toggle("notify_pulls", "s_notify_pulls", "")}
        ${toggle("notify_releases", "s_notify_releases", "")}
        <label class="ctl"><span>${esc(this._t("s_refresh"))}</span>
          <div class="field"><input type="number" inputmode="numeric" data-key="refresh_minutes" min="${GITHUB_PANEL_MIN_REFRESH}" max="${GITHUB_PANEL_MAX_REFRESH}" step="1" value="${esc(String(this._value("refresh_minutes")))}"></div>
          <small>${esc(this._t("s_refresh_hint"))}</small></label>
        <div class="bar"><button class="act" data-action="save"${changed ? "" : " disabled"}>${esc(this._t("save"))}</button>
          ${this._saved ? `<span class="note good" role="status">${esc(this._t("saved"))}</span>` : ""}</div>
      </div>`;
    for (const input of host.querySelectorAll("input[data-key]")) {
      input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
        this._draft[input.dataset.key] =
          input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
        this._saved = false;
        // Typing only refreshes the button, so the field keeps its focus
        const save = host.querySelector("[data-action=save]");
        if (save) save.disabled = !Object.keys(this._draft).some((k) => this._draft[k] !== this._settings[k]);
        host.querySelector(".note.good")?.remove();
      });
    }
    host.querySelector("[data-action=save]")?.addEventListener("click", () => this._save());
  }

  async _save() {
    const draft = { ...this._draft };
    if ("refresh_minutes" in draft) {
      const n = Math.round(Number(draft.refresh_minutes));
      draft.refresh_minutes = Number.isFinite(n)
        ? Math.min(GITHUB_PANEL_MAX_REFRESH, Math.max(GITHUB_PANEL_MIN_REFRESH, n))
        : this._settings.refresh_minutes;
    }
    try {
      const res = await this._hass.callWS({ type: "github_card/update_settings", ...draft });
      if (res.ok) {
        this._settings = res.settings;
        this._draft = {};
        this._saved = true;
      }
    } catch (err) {
      console.error("GitHub panel: could not save the settings", err);
    }
    this._renderSettings();
    // The settings choose the repositories offered
    await this._load();
  }
}

if (!customElements.get("github-panel")) customElements.define("github-panel", GitHubPanel);
