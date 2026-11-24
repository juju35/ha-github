// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
import { esc } from "./helpers.js";

export const BASE_STYLE = `
  :host { display: block; }
  :host { --gh-accent: #8957e5; --gh-blue: #18bcf2; --gh-ok: var(--success-color, #43a047); --gh-warn: var(--warning-color, #ffa600);
          --gh-crit: var(--error-color, #db4437); --gh-focus: var(--primary-color, #03a9f4);
          --gh-star: #e3a008; --gh-green: #2da44e; --gh-purple: #8957e5; }
  ha-card { overflow: hidden; position: relative; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); --c: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible, a:focus-visible { outline: 2px solid var(--gh-focus); outline-offset: -2px; }
  .good { --c: var(--gh-ok); } .open { --c: var(--gh-blue); }
  .star { --c: var(--gh-star); } .fork, .watch, .disc, .dl, .user { --c: var(--gh-blue); }
  .issue, .pr { --c: var(--gh-green); } .merged { --c: var(--gh-purple); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--gh-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--gh-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--gh-ok)) 45%, var(--primary-text-color)); }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; container: gh-header / inline-size; }
  .titles { flex: 1 1 0; min-width: 6.5ch; font-size: 16px; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; row-gap: 2px; }
  .title-row > .name { flex: 1 1 0; min-width: min(6.5ch, 100%); }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Round tinted icon, 40 px, in the project's accent. */
  .logo { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; align-self: flex-start;
          background: color-mix(in srgb, var(--gh-accent) 16%, transparent); color: var(--gh-accent); }
  .logo .icon { width: 24px; height: 24px; }
  .title-row > .chip { flex: 0 1 auto; min-width: 0; white-space: nowrap; }
  .title-row > .chip > .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  @container gh-header (max-width: 180px) {
    .title-row > .chip { padding: 4px; }
    .title-row > .chip > .chip-text { display: none; }
  }
  @container gh-header (max-width: 131px) { .header .logo { display: none; } }
  .warning { padding: 16px; color: color-mix(in srgb, var(--gh-warn) 45%, var(--primary-text-color)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); align-self: flex-start; margin-top: 0; }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--gh-focus); outline-offset: 1px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; container: gh-content / inline-size; }
  /* Counter tiles: icon in its colour, label, value. */
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .icon { color: var(--c, var(--gh-blue)); width: 16px; height: 16px; }
  .tile > div { min-width: 0; }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 14px; font-weight: 500; }
  /* Links to GitHub: an icon button, never a filled one. */
  .link { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: var(--secondary-text-color); }
  .link .icon { width: 14px; height: 14px; }
  .link:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  /* No repository shown: what to do, and an outlined button to the GitHub integration (never a filled one). */
  .empty { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .empty > .icon { color: var(--gh-accent); margin-top: 1px; }
  .empty .t { font-size: 14px; font-weight: 500; }
  .empty .h { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .empty .action { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 4px 12px;
                   border-radius: 16px; font-size: 12px; font-weight: 500; color: var(--gh-accent);
                   border: 1px solid color-mix(in srgb, var(--gh-accent) 50%, transparent); }
  .empty .action .icon { width: 14px; height: 14px; }
  .empty .action:hover { background: color-mix(in srgb, var(--gh-accent) 12%, transparent); }
  .empty .action:focus-visible { outline: 2px solid var(--gh-focus); outline-offset: 1px; }
`;

/** Opens a page of the Home Assistant frontend, as its own links do. */
export const navigate = (path) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

export const INTEGRATION_PATH = "/config/integrations/integration/github";

export const FULL_STYLE = `
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin: 4px 0 2px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: none; letter-spacing: 0; }
  .content.embed { padding: 0; }
  .repo { border-radius: 12px; border: 1px solid var(--divider-color, rgba(127,127,127,.2)); overflow: hidden; }
  .repo-head { display: flex; align-items: center; gap: 8px; padding: 8px 6px 8px 10px; min-height: 24px; }
  .repo-head.toggle { cursor: pointer; user-select: none; }
  .repo-head .icon { color: var(--secondary-text-color); }
  .repo-head .repo-name { flex: 1 1 0; min-width: 0; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .repo-head .counts { display: inline-flex; gap: 10px; font-size: 12px; color: var(--secondary-text-color); flex: none; }
  .repo-head .counts > span { display: inline-flex; align-items: center; gap: 3px; }
  .repo-head .counts .icon { width: 14px; height: 14px; color: var(--c); }
  /* Folded: chevron to the right; unfolded: down (as in ha-carburants-france). */
  .repo-head .chevron { transition: transform .15s; }
  .repo-head.closed .chevron { transform: rotate(-90deg); }
  .repo-body { padding: 0 10px 10px; display: flex; flex-direction: column; gap: 8px; }
  .latest { display: flex; flex-direction: column; gap: 2px; }
  .row { display: grid; grid-template-columns: 18px minmax(0, max-content) minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 13px; min-height: 26px; }
  .row .icon { color: var(--secondary-text-color); }
  .row .k { color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .v { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .v small { color: var(--secondary-text-color); font-size: 11px; margin-left: 4px; }
  /* Narrow card: the label goes under the icon line, the value keeps its width. */
  @container gh-content (max-width: 300px) {
    .row { grid-template-columns: 18px minmax(0, 1fr) auto; }
    .row .k { display: none; }
    .repo-head .counts .c-pr, .repo-head .counts .c-issue { display: none; }
  }
`;

export const MINI_STYLE = `
  .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .tiles .tile { justify-content: center; padding: 6px 4px; gap: 4px; }
  .tiles .tile .k { display: none; }
  @container gh-content (max-width: 220px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .list { display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, max-content); column-gap: 10px; row-gap: 2px; }
  .item { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; align-items: center; font-size: 13px; padding: 3px 0; }
  .item .n { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item > span:not(.n) { display: inline-flex; align-items: center; gap: 3px; justify-content: flex-end; font-size: 12px; color: var(--secondary-text-color); }
  .item .icon { width: 14px; height: 14px; color: var(--c); }
  .item.more { color: var(--secondary-text-color); font-size: 12px; }
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 8px; font-size: 12px; color: var(--secondary-text-color); }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
`;

// ---------------------------------------------------------------------------
// Illustrated header: a developer's desk at the right of a 200 × 80 picture (laptop showing a commit graph, a mug of
// coffee), on a 10 px desk strip under the whole banner. The left of the banner is open wall: the title sits there.
// The state of the repositories shown changes the picture: nothing open (commits flowing), open issues and pull
// requests (an amber count by the laptop), a pull request just merged (the branch joins main), unknown or unavailable.
// ---------------------------------------------------------------------------

// A merge is shown for ten minutes after the merged pull requests' count went up.
export const GH_MERGE_MS = 10 * 60 * 1000;

// Colour of the header icon by state: green (nothing open), amber (open issues/PRs), purple (merged), grey, red.
export const GH_STATE_COLOR = {
  ok: "var(--gh-ok)",
  issues: "var(--gh-warn)",
  merge: "var(--gh-purple)",
  unknown: "var(--gh-idle)",
  error: "var(--gh-crit)",
};

/** Night picture: forced by `illustration_theme`, else Home Assistant's dark theme alone (a light theme keeps the day picture after sunset). */
export const ghIsNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};


/** The picture. `uid` keeps each card's clip path apart on a page with several cards; `label` is the open count. */
export const ghSceneSvg = (uid, state, label = "") => {
  const dots = [-20, -8, 8, 20].map((x, i) => `<circle class="gh-dot" style="animation-delay:${i * 0.45}s" cx="${x}" cy="-12" r="2.4"/>`).join("");
  let badge = "";
  if (state === "issues") {
    const small = label.length > 2;
    badge = `<g class="gh-badge issues" transform="translate(190 50)"><circle r="${small ? 8 : 7}"/><text y="${small ? 2 : 2.8}" font-size="${small ? 5.6 : 8}">${esc(label)}</text></g>`;
  } else if (state === "merge") {
    badge = `<g class="gh-badge merge" transform="translate(190 50)"><circle r="7"/><path d="M-2 -3 v6 M2 -3 a2 2 0 0 1 0 4 h-4"/></g>`;
  } else if (state === "error") {
    badge = `<g class="gh-badge error" transform="translate(190 50)"><circle r="7"/><path d="M0 -3.6 V0.8 M0 2.6 V3.4"/></g>`;
  }
  return `<svg class="gh-scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><clipPath id="gh-scr-${uid}"><rect x="-27" y="-37" width="54" height="32" rx="1"/></clipPath></defs>
    <rect class="gh-desk" x="90" y="64" width="110" height="3"/>
    <g transform="translate(140 64)">
      <rect class="gh-lid" x="-30" y="-40" width="60" height="38" rx="2"/>
      <rect class="gh-screen" x="-27" y="-37" width="54" height="32" rx="1"/>
      <g class="gh-graph" clip-path="url(#gh-scr-${uid})">
        <path class="gh-main" d="M-20 -12 H20"/><path class="gh-branch" d="M-8 -12 Q-4 -24 4 -24 H16"/>
        ${dots}<circle class="gh-head" cx="16" cy="-24" r="2.4"/><circle class="gh-ring" cx="16" cy="-24" r="2.4"/>
        ${state === "merge" ? '<path class="gh-mergeline" pathLength="1" d="M16 -24 Q24 -24 20 -12"/>' : ""}
      </g>
      <rect class="gh-base" x="-36" y="-2" width="72" height="3" rx="1"/>
    </g>
    ${badge}
    <g transform="translate(104 64)">
      <path class="gh-steam" d="M-2 -14 q-2 -3 0 -6 q2 -3 0 -6"/><path class="gh-steam s2" d="M2 -15 q-2 -3 0 -6 q2 -3 0 -6"/>
      <rect class="gh-mug" x="-6" y="-12" width="12" height="12" rx="2"/><path class="gh-handle" d="M6 -9 q4 0 4 3 q0 3 -4 3"/>
    </g>
  </svg>`;
};

export const BANNER_STYLE = `
  :host { --gh-idle: #8a94a0; }
  .banner { position: relative; overflow: hidden; height: 90px; container: gh-banner / inline-size; color: #0d2a45; background: #eef1f6; }
  .banner.night { color: #fff; background: #262c3a; }
  .banner + .content { padding-top: 10px; }
  /* The desk leaves the title row at least 250 px, so the pill stays beside the title; with the detail button in the
     corner, it is drawn lower and smaller, under the button. */
  .banner { --gh-scene-w: min(200px, 54%, max(40%, 100% - 250px)); }
  .banner:has(> .zoom) { --gh-scene-w: min(135px, 40%); }
  .gh-scene { position: absolute; right: 0; bottom: 10px; height: 80px; width: var(--gh-scene-w); }
  /* The desk: a 10 px strip under the whole banner, edge to edge. */
  .gh-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: #b98a5c; box-shadow: inset 0 2px 0 #d4a878; }
  .night .gh-ground { background: #4a3a2c; box-shadow: inset 0 2px 0 #5c4836; }
  .htext { position: absolute; left: 14px; top: 0; bottom: 10px; right: calc(var(--gh-scene-w) + 4px); display: flex; align-items: center;
           gap: 10px; min-width: 0; }
  .htext .titles { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); container: gh-titles / inline-size; }
  /* The status pill on the title's row, in the icon's colour: the title ellipsises first (4 characters kept). */
  .banner .title-row { flex-wrap: nowrap; min-width: 0; }
  .banner .title-row > .name { flex: 0 1 auto; min-width: 4.6ch; }
  .banner .title-row > .chip { flex: none; max-width: none; overflow: hidden; box-sizing: border-box; }
  .banner .logo { position: relative; align-self: center; color: var(--ic); background: rgba(255,255,255,.62);
                  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ic) 22%, transparent); }
  .banner.night .logo { color: color-mix(in srgb, var(--ic) 80%, #fff); background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  /* The GitHub mark in a badge on the header icon, on a white tile readable on any theme. */
  .banner .badge { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; padding: 2px; box-sizing: border-box;
                   display: grid; place-items: center; background: #fff; color: #1f2328; box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }
  .banner .badge .icon { width: 14px; height: 14px; }
  .banner .sub { color: #3b5b78; font-size: 13px; }
  .banner.night .sub { color: rgba(255,255,255,.78); }
  .banner .chip { --c: var(--ic); background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; color: #33506b; background: rgba(255,255,255,.55);
                  box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { color: #33506b; background: rgba(255,255,255,.75); }
  .banner.night .zoom:hover { color: #fff; background: rgba(255,255,255,.22); }
  /* The whole title and the pill's whole label do not fit on one row (measured, see _fitPill): the pill on a line of
     its own under the subtitle, which keeps one line; when that does not fit above the desk, its dot alone; on a very
     narrow card, its dot alone too. */
  .banner .titles.below .title-row { display: contents; }
  .banner .titles.below .title-row > .chip { grid-row: 3; justify-self: start; max-width: 100%; margin-top: 3px; }
  .banner .titles.below .sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .banner .titles.dot-only .title-row > .chip { padding: 4px; } .banner .titles.dot-only .title-row > .chip > .chip-text { display: none; }
  @container gh-banner (max-width: 200px) { .banner .title-row > .chip { padding: 4px; } .banner .title-row > .chip > .chip-text { display: none; } }
  /* Narrow card: no room for the desk beside the text, the wall and the strip stay. */
  @container gh-banner (max-width: 300px) { .gh-scene { display: none; } .htext { right: 36px; } }
  .gh-desk { fill: #c9b79c; } .night .gh-desk { fill: #3c4558; }
  .gh-lid { fill: #2a3038; }
  .gh-screen { fill: #f6f8fa; } .night .gh-screen { fill: #0d1117; }
  .gh-base { fill: #9aa3ae; }
  .gh-graph path { fill: none; stroke-width: 1.6; }
  .gh-main, .gh-branch { stroke: #7f77dd; }
  .gh-dot { fill: #2f80ed; }
  .gh-head { fill: #d4537e; }
  .gh-ring { fill: none; stroke: #d4537e; stroke-width: .8; opacity: 0; transform-box: fill-box; transform-origin: center; }
  .gh-mergeline { stroke: #43a047; stroke-dasharray: 1; stroke-dashoffset: 0; }
  .gh-unknown .gh-graph, .gh-error .gh-graph { opacity: .35; filter: grayscale(1); }
  .gh-badge text { fill: #fff; font-weight: 700; text-anchor: middle; font-family: Roboto, Arial, sans-serif; }
  .gh-badge path { fill: none; stroke: #fff; stroke-width: 1.2; stroke-linecap: round; }
  .gh-badge.issues circle { fill: #f5b400; } .gh-badge.merge circle { fill: #7f77dd; } .gh-badge.error circle { fill: #db4437; }
  .gh-badge { transform-box: fill-box; }
  .gh-mug { fill: #f5b400; } .gh-handle { fill: none; stroke: #f5b400; stroke-width: 1.6; }
  .gh-steam { fill: none; stroke: #9aa3ae; stroke-width: .8; stroke-linecap: round; opacity: 0; }
  .night .gh-steam { stroke: #c3cad4; }
  /* Animations: commits pop along the graph, the head commit pulses, steam rises, the merge draws in. */
  .gh-ok .gh-dot, .gh-issues .gh-dot, .gh-merge .gh-dot { animation: gh-pop 3.6s ease-in-out infinite; }
  .gh-ok .gh-ring, .gh-issues .gh-ring { animation: gh-ring 2.4s ease-out infinite; }
  .gh-steam { animation: gh-steam 3.2s ease-in-out infinite; } .gh-steam.s2 { animation-delay: 1.6s; }
  .gh-mergeline { animation: gh-merge 3s ease-in-out infinite; }
  .gh-badge.issues circle, .gh-badge.error circle { animation: gh-blink 2.4s ease-in-out infinite; }
  @keyframes gh-pop { 0%, 70%, 100% { opacity: 1; } 80% { opacity: .35; } }
  @keyframes gh-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(2.6); } }
  @keyframes gh-steam { 0% { opacity: 0; transform: translateY(2px); } 40% { opacity: .9; } 100% { opacity: 0; transform: translateY(-4px); } }
  @keyframes gh-merge { 0% { stroke-dashoffset: 1; } 45%, 100% { stroke-dashoffset: 0; } }
  @keyframes gh-blink { 50% { opacity: .7; } }
  @media (prefers-reduced-motion: reduce) {
    .gh-dot, .gh-ring, .gh-steam, .gh-mergeline, .gh-badge circle { animation: none !important; }
    .gh-steam { opacity: .6; }
  }
`;
