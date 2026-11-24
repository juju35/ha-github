// ── End of the folded top bar ──
import { GITHUB_PANEL_MAX_REFRESH, GITHUB_PANEL_MIN_REFRESH, GITHUB_PANEL_SORTS, GITHUB_PANEL_TABS } from "./core.js";
import { GITHUB_PANEL_ICONS, GITHUB_PANEL_LATEST, GITHUB_PANEL_REPO_STATS, GITHUB_PANEL_SCENE, GITHUB_PANEL_STRINGS, GITHUB_PANEL_USER_STATS, githubPanelEsc, githubPanelHideMode, githubPanelIcon, githubPanelKeepView } from "./helpers.js";
import { githubPanelFold } from "./fold.js";

export class GitHubPanel extends HTMLElement {
  static STYLE = `
    :host { display:block; min-height:100%; background:var(--primary-background-color); color:var(--primary-text-color);
            --gh-accent:#8957e5; --tone-good:var(--success-color, #43a047); --tone-warn:var(--warning-color, #ffa600); --tone-bad:var(--error-color, #db4437); }
    .i { width:18px; height:18px; fill:currentColor; flex:none; }
    /* The top bar: the desk banner across the page (title, status, Refresh / GitHub / settings in its corner), as
       on the ENT ONE panel; the tabs under it, on the page background, sticky */
    .topbar .banner { height:90px; }
    .topbar .bhead { padding:0 8px; right:calc(min(360px, 44%) + 150px); }
    .topbar .bname { font-size:20px; }
    .topbar .hmenu { flex:none; color:inherit; }
    .topbar .scene { right:150px; }
    .hacts { position:absolute; z-index:2; top:calc((100% - 10px) / 2 - 17px); right:12px; display:flex; gap:6px; }
    .hacts > * { all:unset; cursor:pointer; box-sizing:border-box; width:34px; height:34px; border-radius:50%; display:grid; place-items:center;
                 color:#33506b; background:rgba(255,255,255,.55); box-shadow:inset 0 0 0 1px rgba(255,255,255,.7); }
    .hacts > *:hover { background:rgba(255,255,255,.82); }
    .hacts > *:focus-visible { outline:2px solid var(--gh-accent); outline-offset:1px; }
    .hacts > *[disabled] { opacity:.6; cursor:default; }
    .night .hacts > * { color:#fff; background:rgba(255,255,255,.12); box-shadow:inset 0 0 0 1px rgba(255,255,255,.2); }
    .hacts .i { width:20px; height:20px; }
    .hacts .spin .i { animation:gh-spin 1s linear infinite; }
    @keyframes gh-spin { to { transform:rotate(360deg); } }
    @media (max-width: 600px) { .topbar .scene { display:none; } .topbar .bhead { right:150px; } }
    .tabs { display:flex; align-items:center; gap:4px; padding:0 12px; overflow-x:auto; background:var(--primary-background-color);
            border-bottom:1px solid var(--divider-color, rgba(0,0,0,.12)); position:sticky; top:0; z-index:2; }
    .tab { background:none; border:none; border-bottom:2px solid transparent; color:var(--secondary-text-color); padding:12px 12px 10px; font:inherit;
           font-size:14px; font-weight:500; cursor:pointer; white-space:nowrap; }
    .tab:hover { color:var(--primary-text-color); }
    .tab:focus-visible { outline:2px solid var(--primary-color); outline-offset:-2px; }
    .tab.active { color:var(--primary-text-color); border-bottom-color:var(--gh-accent); }
    /* Top bar hidden (Settings): the tabs alone at the top; the menu button stays where Home Assistant shows it
       (narrow screen or sidebar hidden), at the start of the tabs */
    :host([bare]) .topbar { display:none; }
    .tabmenu { display:none; color:var(--primary-text-color); align-self:center; margin-inline-end:4px; }
    :host([bare][menu]) .tabmenu { display:flex; }
    /* Count badge on the Issues and Pull requests tabs */
    .tab .badge { display:inline-block; margin-inline-start:6px; min-width:18px; padding:0 5px; border-radius:9px; font-size:11px; box-sizing:border-box;
                  line-height:18px; text-align:center; font-weight:500; vertical-align:middle;
                  color:color-mix(in srgb, var(--gh-accent) 60%, var(--primary-text-color)); background:color-mix(in srgb, var(--gh-accent) 16%, transparent); }
    /* A tab's header in its first card (the illustration is in the top bar now) */
    .thead { display:flex; align-items:center; gap:12px; padding:12px 16px 0; min-width:0; }
    .thead .badge-ic { background:color-mix(in srgb, var(--tone, var(--gh-accent)) 14%, transparent); box-shadow:none; }
    .thead .bsub { color:var(--secondary-text-color); }
    /* Settings: the tab's header inside the first card, over its first group */
    .sethead { padding-bottom:10px; margin-bottom:2px; border-bottom:1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .sethead .thead { padding:0; }
    .thead .stpill { background:color-mix(in srgb, var(--c) 15%, transparent); color:color-mix(in srgb, var(--c) 55%, var(--primary-text-color)); }
    /* Repository filter: the repositories with open items only, the busiest first; the rest behind "+ N more" */
    .more { position:relative; }
    .more > summary { list-style:none; } .more > summary::-webkit-details-marker { display:none; }
    .more > summary.chip { border-style:dashed; border-color:var(--divider-color, rgba(127,127,127,.4)); }
    .more .pop { position:absolute; z-index:3; top:calc(100% + 6px); left:0; width:300px; max-height:320px; overflow:auto; padding:8px; box-sizing:border-box;
                 background:var(--card-background-color, #fff); border:1px solid var(--divider-color, rgba(127,127,127,.3)); border-radius:12px;
                 box-shadow:0 8px 24px rgba(0,0,0,.14); display:flex; flex-direction:column; gap:2px; }
    .more .pop .search { margin-bottom:4px; }
    .more .pop .chip { justify-content:space-between; border-radius:8px; min-height:32px; }
    .more .pop .chip[hidden] { display:none; }
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
    .info .star .i { color:#e3a008; } .info .ok .i { color:var(--tone-good); } .info .tag .i { color:var(--gh-accent); } .info .dl .i { color:#3b82f6; }
    /* Total downloads of the followed repositories, at the foot of the Repositories tab */
    .dl-total { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--secondary-text-color); }
    .dl-total:empty { display:none; }
    .dl-total:not(:empty) { border-top:1px solid var(--divider-color, rgba(127,127,127,.15)); padding-top:10px; margin-top:2px; }
    .dl-total .i { width:16px; height:16px; color:#3b82f6; }
    .detail { padding:4px 0 12px 26px; }
    /* The unfolded repository and the account, drawn by the panel as the GitHub Card draws them: counter tiles,
       latest activity rows (each opens its more-info), links to GitHub as round icon buttons (never filled) */
    .dt { display:flex; flex-direction:column; gap:8px; container:gh-dt / inline-size;
          --dt-blue:#18bcf2; --dt-star:#e3a008; --dt-green:#2da44e; --dt-purple:#8957e5; }
    .dt .c-star { --c:var(--dt-star); } .dt .c-blue { --c:var(--dt-blue); } .dt .c-green { --c:var(--dt-green); } .dt .c-purple { --c:var(--dt-purple); }
    .dt [role="button"] { cursor:pointer; }
    .dt [role="button"]:focus-visible { outline:2px solid var(--primary-color, #03a9f4); outline-offset:-2px; }
    .dt-tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(124px, 1fr)); gap:6px; }
    .dt-tile { display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:10px; min-width:0;
               background:var(--secondary-background-color, rgba(127,127,127,.08)); }
    .dt-tile > .i { color:var(--c, var(--dt-blue)); width:16px; height:16px; }
    .dt-tile > div { min-width:0; }
    .dt-tile .k { font-size:11px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dt-tile .v { font-size:14px; font-weight:500; }
    .dt-link { flex:none; display:grid; place-items:center; width:24px; height:24px; border-radius:50%; color:var(--secondary-text-color); }
    .dt-link .i { width:14px; height:14px; }
    .dt-link:hover { background:color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color:var(--primary-text-color); }
    .dt-latest { display:flex; flex-direction:column; gap:2px; }
    .dt-row { display:grid; grid-template-columns:18px minmax(0, max-content) minmax(0, 1fr) auto; align-items:center; gap:8px; font-size:13px; min-height:26px; }
    .dt-row > .i { color:var(--secondary-text-color); }
    .dt-row .k { color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dt-row .v { min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dt-row .v small { color:var(--secondary-text-color); font-size:11px; margin-left:4px; }
    .dt-sec { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:var(--secondary-text-color); margin:4px 0 2px; }
    .dt-sec > .i { width:16px; height:16px; }
    .dt-sec .label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    @container gh-dt (max-width: 300px) { .dt-row { grid-template-columns:18px minmax(0, 1fr) auto; } .dt-row .k { display:none; } }
    @media (max-width: 600px) { .info .tag, .info .ok:nth-child(3) { display:none; } .detail { padding-left:0; } }
    /* Confirmation in place of the row, like the card popups (at the top of what they act on) */
    .confirm { flex-direction:column; align-items:stretch; gap:8px; padding:10px 12px; margin:4px 0; border-radius:10px;
               border:1px solid color-mix(in srgb, var(--tone-bad) 45%, transparent); background:color-mix(in srgb, var(--tone-bad) 8%, transparent); }
    .confirm .b { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
    /* Narrow (phone): the name keeps the line, the chip goes */
    @media (max-width: 420px) { .row .chip { display:none; } }
    /* Narrow list (phone): the name takes the whole first line; counters, link and button wrap to a second line */
    .list { container-type:inline-size; }
    @container (max-width: 560px) {
      .row:not(.confirm) { flex-wrap:wrap; row-gap:6px; }
      .row .fold { flex:1 1 calc(100% - 38px); }
      .row > .n { flex:1 1 calc(100% - 94px); }
      .row .link { order:1; }
      .row .info { order:2; flex:1 1 0; min-width:0; overflow:hidden; padding-left:26px; }
      .row .info .tag { display:none; }
      .row > .act { order:3; min-width:0; padding:5px 12px; margin-left:auto; }
    }
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
    /* ── The cards' charter (as the ha-* cards and the System Hub / Cameras panels): a header card per tab with its
       illustrated banner, then lists under an uppercase title, their rows filled and rounded with a round tinted icon,
       counters as small pills, pill buttons, the project's purple as accent ── */
    :host { --gh-sec:color-mix(in srgb, var(--primary-text-color) 6%, var(--card-background-color, #fff)); --gh-ink:color-mix(in srgb, var(--gh-accent) 70%, var(--primary-text-color)); }
    main { max-width:1180px; }
    section > div { display:flex; flex-direction:column; gap:12px; }
    .card { background:var(--ha-card-background, var(--card-background-color, #fff)); border-radius:var(--ha-card-border-radius, 12px); overflow:hidden;
            border:var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, rgba(127,127,127,.2))); box-shadow:var(--ha-card-box-shadow, none); }
    .card[hidden] { display:none; }
    .card.list { padding:12px 16px 14px; display:flex; flex-direction:column; gap:8px; }
    .cbody { padding:12px 16px 16px; display:flex; flex-direction:column; gap:10px; }
    .cbody:empty { display:none; }
    .lhead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-height:36px; }
    .pick-acts { display:contents; }
    .lname { flex:1 1 140px; margin:0; font-size:12px; font-weight:500; letter-spacing:.05em; text-transform:uppercase; color:var(--secondary-text-color); }
    .rows { display:flex; flex-direction:column; gap:6px; container-type:inline-size; }
    .grow { flex:1; }
    /* Banner */
    .banner { position:relative; height:90px; overflow:hidden; background:#f2efe9; color:#1f2328; --gh-muted:#5d6670; container-type:inline-size; }
    .banner.night { background:#2a2b33; color:#fff; --gh-muted:rgba(255,255,255,.78); }
    .scene { position:absolute; right:20px; bottom:10px; width:min(360px, 44%); height:80px; }
    .ground { position:absolute; left:0; right:0; bottom:0; height:10px; background:repeating-linear-gradient(90deg, #c99a6b 0 38px, #b98a5c 38px 40px); box-shadow:inset 0 2px 0 #a97c50; }
    .night .ground { background:repeating-linear-gradient(90deg, #4a3a2c 0 38px, #3e3024 38px 40px); box-shadow:inset 0 2px 0 #5a4634; }
    .s-mon { fill:#2d3440; } .night .s-mon { fill:#0f141b; }
    .s-scr { fill:#f8f9fb; } .night .s-scr { fill:#1e2733; }
    .s-desk { fill:#a97c50; } .night .s-desk { fill:#5a4634; }
    .s-deskd { fill:#8f6743; } .night .s-deskd { fill:#46362a; }
    .s-mug { fill:#fff; stroke:#c9ced4; } .night .s-mug { fill:#d8dce2; stroke:#aab1bb; }
    .s-handle { stroke:#c9ced4; } .night .s-handle { stroke:#aab1bb; }
    .s-pot { fill:#d08a5a; } .night .s-pot { fill:#7a4f34; }
    .s-leaf { fill:#6aa56a; transform-box:fill-box; transform-origin:50% 100%; animation:gh-sway 4s ease-in-out infinite; } .night .s-leaf { fill:#3f6e46; }
    .s-pulse { animation:gh-pulse 1.6s ease-in-out infinite; }
    @keyframes gh-sway { 0%, 100% { transform:rotate(-4deg); } 50% { transform:rotate(4deg); } }
    @keyframes gh-pulse { 50% { opacity:.25; } }
    @media (prefers-reduced-motion: reduce) { .scene * { animation:none !important; } }
    .bhead { position:absolute; left:0; top:0; bottom:10px; right:calc(min(360px, 44%) + 28px); padding:0 16px; display:flex; align-items:center; gap:12px; min-width:0; }
    .badge-ic { width:40px; height:40px; flex:none; border-radius:50%; display:grid; place-items:center; color:var(--tone, var(--gh-accent));
                background:rgba(255,255,255,.62); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--tone, var(--gh-accent)) 24%, transparent); }
    .badge-ic .i { width:24px; height:24px; }
    .night .badge-ic { background:rgba(255,255,255,.12); color:color-mix(in srgb, var(--tone, var(--gh-accent)) 72%, #fff); box-shadow:inset 0 0 0 1px rgba(255,255,255,.14); }
    .btitles { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
    .brow { display:flex; align-items:center; flex-wrap:wrap; gap:4px 8px; min-width:0; }
    .bname { font-size:16px; font-weight:500; line-height:1.25; white-space:nowrap; }
    .bsub { font-size:13px; line-height:18px; color:var(--gh-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .stpill { display:inline-flex; align-items:center; gap:4px; padding:1px 8px; border-radius:12px; font-size:11px; font-weight:500; line-height:16px; white-space:nowrap;
              --c:var(--gh-accent); background:color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color:color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .stpill::before { content:""; width:7px; height:7px; border-radius:50%; background:var(--c); }
    .stpill.good { --c:var(--tone-good); } .stpill.warn { --c:var(--tone-warn); } .stpill.bad { --c:var(--tone-bad); } .stpill.muted { --c:#8a96a6; }
    .night .stpill { background:color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color:color-mix(in srgb, var(--c) 35%, #fff); }
    @container (max-width:420px) { .scene { display:none; } .bhead { right:0; } }
    /* Tiles and rows */
    .kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:8px; }
    .tile { display:flex; align-items:center; gap:10px; min-height:56px; padding:8px 10px 8px 8px; border-radius:12px; background:var(--gh-sec); box-sizing:border-box; min-width:0; }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv b { font-size:17px; font-weight:500; line-height:1.2; }
    .kv span { font-size:12px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ic { width:40px; height:40px; flex:none; border-radius:50%; display:grid; place-items:center; color:var(--primary-text-color);
          background:color-mix(in srgb, var(--secondary-text-color) 14%, transparent); }
    .ic .i { width:20px; height:20px; }
    .ic.acc { color:var(--gh-ink); background:color-mix(in srgb, var(--gh-accent) 16%, transparent); }
    .ic.good { color:color-mix(in srgb, var(--tone-good) 70%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-good) 16%, transparent); }
    .ic.gold { color:#9a6b00; background:rgba(232,168,0,.18); }
    .ic.blue { color:color-mix(in srgb, #3b82f6 75%, var(--primary-text-color)); background:color-mix(in srgb, #3b82f6 16%, transparent); }
    .row { border-top:0; padding:8px 10px 8px 8px; min-height:56px; border-radius:12px; background:var(--gh-sec); box-sizing:border-box; border:1px solid transparent; }
    .row.open { border-color:color-mix(in srgb, var(--gh-accent) 40%, transparent); }
    .row.sel { background:color-mix(in srgb, var(--gh-accent) 9%, var(--gh-sec)); border-color:color-mix(in srgb, var(--gh-accent) 26%, transparent); }
    .row.confirm { border-color:color-mix(in srgb, var(--tone-bad) 45%, transparent); background:color-mix(in srgb, var(--tone-bad) 8%, var(--gh-sec)); margin:0; }
    .who { all:unset; flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; cursor:default; }
    button.who { cursor:pointer; border-radius:6px; }
    button.who:focus-visible { outline:2px solid var(--gh-accent); outline-offset:2px; }
    .who .n { font-size:14px; font-weight:500; flex:none; }
    .who .s { font-size:12px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chev { all:unset; width:28px; height:36px; flex:none; display:grid; place-items:center; cursor:pointer; color:var(--secondary-text-color); border-radius:6px; }
    .chev .i { transition:transform .15s; }
    .row.open .chev .i { transform:rotate(90deg); }
    .chev:focus-visible { outline:2px solid var(--gh-accent); }
    .info { gap:6px; flex-wrap:wrap; justify-content:flex-end; }
    .info > span { height:24px; padding:0 8px; border-radius:12px; font-size:12px; font-weight:500; color:var(--primary-text-color); background:var(--card-background-color, #fff); }
    .info .star { color:#9a6b00; } .info .ok { color:color-mix(in srgb, var(--tone-good) 70%, var(--primary-text-color)); }
    .info .pr, .info .tag { color:var(--gh-ink); } .info .dl { color:color-mix(in srgb, #3b82f6 75%, var(--primary-text-color)); }
    .info .i, .info .star .i, .info .ok .i, .info .tag .i, .info .dl .i { color:inherit; }
    .row .link { width:36px; height:36px; background:var(--card-background-color, #fff); color:var(--primary-text-color); }
    .row .link:hover { color:var(--gh-ink); background:var(--card-background-color, #fff); }
    .detail { padding:0 0 4px 38px; }
    /* Pill buttons, tinted, never filled */
    .act { min-height:36px; box-sizing:border-box; padding:0 14px; border-radius:18px; border:0; color:var(--gh-ink); background:color-mix(in srgb, var(--gh-accent) 14%, transparent); }
    .act:hover:not([disabled]) { background:color-mix(in srgb, var(--gh-accent) 22%, transparent); }
    .act.quiet { color:var(--primary-text-color); background:var(--gh-sec); }
    .act.quiet:hover:not([disabled]) { background:color-mix(in srgb, var(--primary-text-color) 10%, var(--card-background-color, #fff)); }
    .row .act.quiet { background:var(--card-background-color, #fff); }
    .act.bad { color:color-mix(in srgb, var(--tone-bad) 60%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-bad) 14%, transparent); }
    .row > .act { min-width:0; }
    .search { flex:0 1 260px; min-width:160px; height:36px; border:0; border-radius:18px; padding:0 4px 0 12px; gap:6px; color:var(--secondary-text-color); background:var(--gh-sec); }
    .search .i { width:16px; height:16px; }
    .search:focus-within { box-shadow:inset 0 0 0 2px var(--gh-accent); }
    .search input { padding:8px 6px; color:var(--primary-text-color); }
    .seg { display:inline-flex; flex-wrap:wrap; gap:2px; padding:3px; border-radius:18px; background:var(--gh-sec); }
    .seg button { border:0; background:none; cursor:pointer; font:inherit; font-size:12.5px; font-weight:500; padding:6px 12px; border-radius:15px; color:var(--secondary-text-color); }
    .seg button[aria-pressed="true"] { background:var(--card-background-color, #fff); color:var(--gh-ink); box-shadow:0 1px 2px rgba(0,0,0,.14); }
    .seg button:focus-visible, .chip:focus-visible { outline:2px solid var(--gh-accent); outline-offset:1px; }
    .chips { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .chip { display:inline-flex; align-items:center; gap:6px; min-height:34px; padding:0 12px; border-radius:17px; border:1px solid transparent; cursor:pointer;
            font:inherit; font-size:13px; font-weight:500; color:var(--primary-text-color); background:var(--gh-sec); }
    .chip em { font-style:normal; font-size:11.5px; opacity:.7; }
    .chip[aria-pressed="true"] { color:var(--gh-ink); background:color-mix(in srgb, var(--gh-accent) 14%, transparent); border-color:color-mix(in srgb, var(--gh-accent) 35%, transparent); }
    .row .pick-repo { width:20px; height:20px; border-radius:6px; border-color:#9aa3ae; }
    /* Issues and pull requests: a row per item */
    a.row.item { gap:10px; align-items:center; text-decoration:none; color:inherit; }
    a.row.item:hover { background:color-mix(in srgb, var(--gh-accent) 7%, var(--gh-sec)); }
    a.row.item:hover .n { color:var(--gh-ink); }
    .item .who .n { white-space:normal; overflow-wrap:anywhere; }
    .item .who .s { white-space:normal; }
    .item .cnt { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; max-width:45%; flex:none; }
    .item .cnt .com { display:inline-flex; align-items:center; gap:3px; height:22px; padding:0 8px; border-radius:11px; font-size:12px; background:var(--card-background-color, #fff); color:var(--secondary-text-color); }
    .item .cnt .com .i { width:13px; height:13px; }
    .rev, .lbl { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; line-height:16px; padding:3px 9px; border-radius:12px; white-space:nowrap; }
    .rev::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; opacity:.85; }
    .rev.muted { background:var(--card-background-color, #fff); }
    @container (max-width:600px) {
      .row:not(.confirm):not(.item) { flex-wrap:wrap; row-gap:6px; }
      .row .who { flex:1 1 calc(100% - 120px); }
      .row .info { order:2; flex:1 1 100%; justify-content:flex-start; padding-left:38px; }
      .row .info .tag { display:none; }
      .item .cnt { max-width:none; flex:1 1 100%; justify-content:flex-start; order:2; padding-left:50px; }
      a.row.item { flex-wrap:wrap; }
      .detail { padding-left:0; }
    }
    /* Settings: switches, the refresh interval as a segmented choice, the save bar */
    .toggle.row { cursor:pointer; gap:12px; }
    .toggle .who { cursor:pointer; }
    .toggle .who small { font-size:12px; color:var(--secondary-text-color); }
    .toggle.row > .seg { flex:none; flex-direction:row; flex-wrap:nowrap; gap:2px; font-size:inherit; background:color-mix(in srgb, var(--primary-text-color) 7%, transparent); }
    input.sw { appearance:none; -webkit-appearance:none; width:40px; height:24px; margin:0; flex:none; border-radius:12px; position:relative; cursor:pointer;
               background:color-mix(in srgb, var(--secondary-text-color) 45%, transparent); transition:background .15s; }
    input.sw::after { content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.25); transition:left .15s; }
    input.sw:checked { background:var(--gh-accent); }
    input.sw:checked::after { left:19px; }
    input.sw:focus-visible { outline:2px solid var(--gh-accent); outline-offset:2px; }
    .interval { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .interval .field { width:110px; flex:none; }
    .interval small.note { flex:1 1 220px; font-size:12px; }
    .field { border:0; border-radius:10px; background:var(--gh-sec); min-height:44px; align-items:center; }
    .field:focus-within { box-shadow:inset 0 0 0 2px var(--gh-accent); }
    .savebar { padding:10px 12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; position:sticky; bottom:12px; z-index:1; }
    .savebar .note { flex:1; text-align:right; font-size:12.5px; }
  `;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // The counters and latest activity of the unfolded repository and of the account open their more-info dialog
    // (a click, or Enter / Space on the focused row); their GitHub links open as links.
    const moreInfo = (ev) => {
      const el = ev.target?.closest?.(".dt [data-entity]");
      if (!el || ev.target.closest("a")) return;
      if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    };
    this.shadowRoot.addEventListener?.("click", moreInfo);
    this.shadowRoot.addEventListener?.("keydown", moreInfo);
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
    this._mine = null; // my open pull requests (any repository), loaded when the My pull requests tab opens
    this._mineBusy = false;
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
    this._syncBare();
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
    if (this._tabMenu) this._tabMenu.narrow = narrow;
    this._syncBare();
  }

  // The top bar hidden as saved (Settings): for everyone, or for a user who is not an administrator; until the settings
  // arrive, the panel's registration says it, so the bar is never shown then hidden while loading. The tabs stay.
  _bare() {
    const mode = githubPanelHideMode(this._settings?.hide_toolbar ?? this._panel?.config?.hide_toolbar);
    return mode === "all" || (mode === "non_admin" && this._hass?.user?.is_admin === false);
  }

  _syncBare() {
    this.toggleAttribute?.("bare", this._bare());
    // Where Home Assistant shows the menu button: narrow screen, or the sidebar set to always hidden
    this.toggleAttribute?.("menu", Boolean(this._narrow) || this._hass?.dockedSidebar === "always_hidden");
  }

  set hass(hass) {
    const first = !this._hass;
    const before = this._lang();
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (this._tabMenu) this._tabMenu.hass = hass;
    this._syncBare();
    if (!first) this._updateInfo();
    if (!first) this._renderHead();
    if (first) this._start();
    else if (this._lang() !== before) this._render();
  }

  connectedCallback() {
    if (this._hass && !this._unsub) this._subscribe();
    if (!this._fold && this.shadowRoot?.querySelector?.(".topbar")) this._attachFold();
    this._watchConnection(true);
    // Back on the panel after a failed load: try again now.
    if (this._hass && this._failed) this._reload();
  }

  disconnectedCallback() {
    this._fold?.detach();
    this._fold = null;
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
  // Full code when it has a table (sr-Latn), else its base (de-AT → de), else English
  _lang() {
    const code = this._hass?.language || "en";
    if (GITHUB_PANEL_STRINGS[code]) return code;
    const base = code.split("-")[0];
    return GITHUB_PANEL_STRINGS[base] ? base : "en";
  }

  _t(key, vars = {}) {
    let text = GITHUB_PANEL_STRINGS[this._lang()][key] ?? GITHUB_PANEL_STRINGS.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
    return text;
  }

  // The panel draws everything itself (the unfolded repository and the account too): no card to load.
  async _start() {
    this._render();
    this._subscribe();
    this._watchConnection(this.isConnected);
    await this._reload();
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
          this._renderItems("issues");
          this._renderItems("pulls");
    this._renderHandle();
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
    this._syncBare();
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
    // My pull requests are not followed repositories, so they load the first time their tab opens (then cached).
    if (tab === "mine" && !this._mine && !this._mineBusy) this._loadMine();
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
      <div class="topbar"><div class="banner${this._hass?.themes?.darkMode ? " night" : ""}">${GITHUB_PANEL_SCENE}
        <div class="bhead"><ha-menu-button class="hmenu"></ha-menu-button><div class="hinfo" style="display:contents"></div></div>
        <div class="hacts"></div></div></div>
      <div class="tabs" role="tablist"><ha-menu-button class="tabmenu"></ha-menu-button>${tabs}</div>
      <main>
        <section id="tab-repos" role="tabpanel" aria-labelledby="tabbtn-repos"><div id="repos"></div></section>
        <section id="tab-issues" role="tabpanel" aria-labelledby="tabbtn-issues"><div id="issues"></div></section>
        <section id="tab-pulls" role="tabpanel" aria-labelledby="tabbtn-pulls"><div id="pulls"></div></section>
        <section id="tab-mine" role="tabpanel" aria-labelledby="tabbtn-mine"><div id="mine"></div></section>
        <section id="tab-settings" role="tabpanel" aria-labelledby="tabbtn-settings"><div id="settings"></div></section>
      </main>`;
    this._menu = root.querySelector(".topbar ha-menu-button");
    this._renderHead();
    this._tabMenu = root.querySelector(".tabmenu");
    for (const menu of [this._menu, this._tabMenu]) {
      if (!menu) continue;
      menu.hass = this._hass;
      menu.narrow = this._narrow;
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
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    this._renderMine();
    this._renderSettings();
    this._attachFold();
  }

  /** The top bar folds on scroll into one bar with the tabs as icon pills (see githubPanelFold). */
  _attachFold() {
    this._fold?.detach();
    const I = GITHUB_PANEL_ICONS;
    this._fold = githubPanelFold(this, {
      top: ".topbar",
      tabs: ".tabs",
      tab: ".tab",
      key: (b) => b.dataset.tab,
      icons: { repos: I.code, issues: I.issue, pulls: I.pr, mine: I.account, settings: I.cog },
      badge: ".badge",
      name: ".topbar .bname",
      sub: ".topbar .bsub",
      icon: ".topbar .badge-ic",
      status: ".topbar .stpill",
      acts: ".topbar .hacts > *",
      accent: "var(--gh-accent)",
      menu: () => ({ hass: this._hass, narrow: this._narrow, show: this.hasAttribute("menu") }),
    });
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


  /** A tab's header in its first card: its icon, title, status pill and a line under them (the illustration is the
   * panel's top bar). */
  _banner(icon, title, pill, sub, tone) {
    const esc = githubPanelEsc;
    const pillHtml = pill ? `<span class="stpill ${pill.tone || ""}" role="status">${esc(pill.text)}</span>` : "";
    return `<div class="thead"><span class="badge-ic"${tone ? ` style="--tone:${tone}"` : ""}>${githubPanelIcon(icon)}</span>
        <div class="btitles"><div class="brow"><span class="bname">${esc(title)}</span>${pillHtml}</div>${sub ? `<div class="bsub">${esc(sub)}</div>` : ""}</div></div>`;
  }

  /** The top bar across the page: GitHub, how many repositories are followed, the account and when the items were
   * fetched; Refresh, the account on GitHub and the integration as round buttons. Its menu button is kept. */
  _renderHead() {
    const root = this.shadowRoot;
    const info = root?.querySelector?.(".topbar .hinfo");
    if (!info) return;
    const esc = githubPanelEsc;
    const o = this._overview;
    root.querySelector(".topbar .banner")?.classList.toggle("night", Boolean(this._hass?.themes?.darkMode));
    const pill = o?.configured ? `<span class="stpill" role="status">${esc(this._t("summary", { followed: o.followed.length, offered: o.offered.length }))}</span>` : "";
    const sub = [o?.login ? `github.com/${o.login}` : "", this._fetchedLine(this._items)].filter(Boolean).join(" · ");
    info.innerHTML = `<span class="badge-ic">${githubPanelIcon("code")}</span>
      <div class="btitles"><div class="brow"><span class="bname">${esc(this._t("title"))}</span>${pill}</div>${sub ? `<div class="bsub">${esc(sub)}</div>` : ""}</div>`;
    const acts = root.querySelector(".topbar .hacts");
    const refresh = esc(this._t("refresh"));
    const cog = esc(this._t("open_integration"));
    const gh = esc(this._t("open_github"));
    acts.innerHTML = `<button data-action="head-refresh" class="${this._itemsBusy ? "spin" : ""}" title="${refresh}" aria-label="${refresh}"${this._itemsBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}</button>
      ${o?.login ? `<a href="https://github.com/${esc(o.login)}" target="_blank" rel="noopener noreferrer" title="${gh}" aria-label="${gh}">${githubPanelIcon("open")}</a>` : ""}
      <a href="/config/integrations/integration/github" title="${cog}" aria-label="${cog}">${githubPanelIcon("cog")}</a>`;
    acts.querySelector("[data-action=head-refresh]")?.addEventListener("click", () => this._refreshItems());
  }

  /** "1.8K" in the panel's language. */
  _compact(n) {
    try {
      return new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
    } catch (_err) {
      return String(n);
    }
  }

  /** The sum of a live counter over the followed repositories, or null when none is known. */
  _sum(key) {
    const values = (this._overview?.followed || []).map((r) => this._number(r, key)).filter((v) => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  }

  /** The Repositories header's tiles: stars, open issues, open pull requests and downloads of the followed repositories. */
  _kpisHtml() {
    const esc = githubPanelEsc;
    const tile = (key, icon, tone, label) => {
      const v = this._sum(key);
      return `<div class="tile"><span class="ic ${tone}">${githubPanelIcon(icon)}</span><div class="kv"><b>${esc(v === null ? "—" : this._compact(v))}</b><span>${esc(this._t(label))}</span></div></div>`;
    };
    return [
      tile("stargazers_count", "star", "gold", "stars"),
      tile("issues_count", "issue", "good", "sort_issues"),
      tile("pulls_count", "pr", "acc", "sort_pulls"),
      tile("latest_release_downloads", "download", "blue", "downloads"),
    ].join("");
  }

  /** owner/name as two lines: the name, then the owner. */
  _repoWho(name) {
    const esc = githubPanelEsc;
    const [owner, repo] = String(name).split("/");
    return `<span class="n" title="${esc(name)}">${esc(repo || name)}</span><span class="s">${esc(owner)}</span>`;
  }

  _renderRepos() {
    const host = this.shadowRoot.getElementById?.("repos");
    if (!host) return;
    githubPanelKeepView(host, () => this._drawRepos(host));
  }

  _drawRepos(host) {
    const esc = githubPanelEsc;
    const o = this._overview;
    const top = (pill, sub, body) =>
      `<div class="card top">${this._banner("code", this._t("repos"), pill, sub)}<div class="cbody">${body}</div></div>`;
    if (!o) {
      host.innerHTML = top(null, this._t("loading"), "");
      return;
    }
    if (!o.configured) {
      host.innerHTML = top({ tone: "warn", text: this._t("add_github") }, "", `<div class="note">${esc(this._t("no_github"))}</div>
        <div class="bar"><button class="act" data-action="add-github">${githubPanelIcon("plus")}${esc(this._t("add_github"))}</button></div>`);
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
    const rowHtml = (r) => {
      const link = `<a class="link" href="https://github.com/${esc(r.name)}" target="_blank" rel="noopener noreferrer" title="${esc(this._t("open_github"))}" aria-label="${esc(this._t("open_github"))}">${githubPanelIcon("open")}</a>`;
      if (this._confirm === r.name)
        return `<div class="row confirm"><div class="note">${esc(this._t("confirm_unfollow", { repo: r.name }))}</div>
          <div class="b"><button class="act quiet" data-action="cancel">${esc(this._t("cancel"))}</button>
          <button class="act bad" data-action="unfollow-confirmed" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button></div></div>`;
      if (!r.followed) {
        const label = esc(this._t("select_repo", { repo: r.name }));
        const on = this._selected.has(r.name);
        const box = `<input type="checkbox" class="pick-repo" data-repo="${esc(r.name)}" aria-label="${label}" title="${label}"${on ? " checked" : ""}${disabled}>`;
        return `<div class="row${on ? " sel" : ""}">${box}<span class="ic">${githubPanelIcon("code")}</span><div class="who">${this._repoWho(r.name)}</div>${link}
          <button class="act" data-action="follow" data-repo="${esc(r.name)}"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow"))}</button></div>`;
      }
      // A followed repository: the chevron or its name unfolds the GitHub Card's counters and latest activity under the row
      const open = this._expanded === r.name;
      return `<div class="row${open ? " open" : ""}">
          <button class="chev" data-action="expand" data-repo="${esc(r.name)}" aria-expanded="${open}" title="${esc(this._t("details"))}" aria-label="${esc(this._t("details"))}">${githubPanelIcon("chevron")}</button>
          <span class="ic acc">${githubPanelIcon("code")}</span>
          <button class="who fold" data-action="expand" data-repo="${esc(r.name)}" aria-expanded="${open}" title="${esc(this._t("details"))}">${this._repoWho(r.name)}</button>
          <span class="info" data-repo="${esc(r.name)}">${this._infoHtml(r.name)}</span>${link}
          <button class="act quiet" data-action="unfollow" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button></div>
        ${open ? `<div class="detail" data-repo="${esc(r.name)}">${this._detailHtml(r.name)}</div>` : ""}`;
    };
    const followedRows = rows.filter((r) => r.followed);
    const offeredRows = rows.filter((r) => !r.followed);
    const loadFailed = this._message && this._message === this._loadError;
    const account = this._accountHtml();
    const sorts = GITHUB_PANEL_SORTS.map(
      (v) => `<button data-sort="${v}" aria-pressed="${v === this._sort}">${esc(this._t(`sort_${v}`))}</button>`,
    ).join("");
    host.innerHTML = `
      ${top(null, "", `<div class="kpis">${this._kpisHtml()}</div>${notes.join("")}`)}
      <div id="handle">${this._handleHtml()}</div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("followed_head"))} · ${o.followed.length}</h2>
          <div class="seg" role="group" aria-label="${esc(this._t("sort_label"))}">${sorts}</div></div>
        <div class="rows">${followedRows.length ? followedRows.map(rowHtml).join("") : loadFailed ? "" : `<div class="note">${esc(this._t(o.followed.length ? "empty" : "no_followed"))}</div>`}</div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("to_follow"))} · ${o.offered.length}</h2>
          <label class="search">${githubPanelIcon("search")}<input type="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}" value="${esc(this._query)}"></label>
          <span class="pick-acts">${this._pickActsHtml(selected.length, toFollow.length)}</span>
        </div>
        <div class="rows">${offeredRows.length ? offeredRows.map(rowHtml).join("") : `<div class="note">${esc(this._t("empty"))}</div>`}</div>
      </div>
      <div class="card list account-card"${account ? "" : " hidden"}><div class="account-slot">${account}</div></div>`;
    this._bindRepos(host);
    this._renderHead();
  }

  /** Follow the selection / Follow all, redrawn alone when a box is ticked. */
  _pickActsHtml(selected, toFollow) {
    const esc = githubPanelEsc;
    const disabled = this._busy ? " disabled" : "";
    return `${selected ? `<button class="act" data-action="follow-selected"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow_selected", { n: selected }))}</button>` : ""}${
      toFollow > 1 ? `<button class="act quiet" data-action="follow-all"${disabled}>${esc(this._t("follow_all", { n: toFollow }))}</button>` : ""
    }`;
  }

  /** To handle: the latest open pull requests and issues of the followed repositories (the Issues and Pull
   * requests tabs hold the full lists); nothing before the items load or without followed repositories. */
  _handleHtml() {
    const esc = githubPanelEsc;
    const items = this._items;
    if (!items || items.pending || items.error || !this._overview?.followed?.length) return "";
    const pending = [...(items.pulls || []).map((i) => [i, "pulls"]), ...(items.issues || []).map((i) => [i, "issues"])]
      .sort((a, b) => String(b[0].updated || "").localeCompare(String(a[0].updated || "")))
      .slice(0, 6);
    return `<div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("to_handle"))}</h2></div>
        <div class="rows">${pending.length ? pending.map(([i, kind]) => this._itemHtml(i, kind)).join("") : `<div class="note">${esc(this._t("nothing_to_handle"))}</div>`}</div>
      </div>`;
  }

  /** Redraw only the To handle card (the items changed): the Repositories tab's search keeps its focus. */
  _renderHandle() {
    const slot = this.shadowRoot?.getElementById?.("handle");
    if (slot) slot.innerHTML = this._handleHtml();
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
      count("pulls_count", "pr", "pulls", "pr"),
      count("latest_release", "tag", "release", "tag"),
      count("latest_release_downloads", "download", "downloads", "dl"),
    ].join("");
  }

  /** A GitHub sensor's live state object, or undefined. */
  _state(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  /** Counter tiles (icon in its colour, label, compact value, exact value in the tooltip) of the sensors given. */
  _tilesHtml(ids, stats) {
    const esc = githubPanelEsc;
    const tiles = stats
      .filter(([key]) => ids[key])
      .map(([key, label, icon, cls]) => {
        const s = this._state(ids[key]);
        const v = s && s.state !== "" && Number.isFinite(Number(s.state)) ? Number(s.state) : null;
        let full = v === null ? "—" : String(v);
        try {
          if (v !== null) full = new Intl.NumberFormat(this._lang()).format(v);
        } catch (_err) {
          // unknown locale: the plain number
        }
        const title = esc(`${this._t(label)}: ${full}`);
        return `<div class="dt-tile c-${cls}" data-entity="${esc(ids[key])}" role="button" tabindex="0" title="${title}" aria-label="${title}">${githubPanelIcon(icon)}<div>
          <div class="k">${esc(this._t(label))}</div><div class="v">${v === null ? "—" : esc(this._compact(v))}</div></div></div>`;
      });
    return tiles.length ? `<div class="dt-tiles">${tiles.join("")}</div>` : "";
  }

  /** A link to a GitHub page (web links only: a state attribute never becomes a javascript: URL). */
  _ghLink(url) {
    const u = /^https?:\/\//i.test(String(url || "")) ? String(url) : "";
    const title = githubPanelEsc(this._t("open_github"));
    return u ? `<a class="dt-link" href="${githubPanelEsc(u)}" target="_blank" rel="noopener noreferrer" title="${title}" aria-label="${title}">${githubPanelIcon("open")}</a>` : "";
  }

  /** The unfolded repository: its counters, then its latest release, tag, commit, pull request, issue and discussion. */
  _detailHtml(repo) {
    const esc = githubPanelEsc;
    const ids = this._overview?.sensors?.[repo] || {};
    const rows = GITHUB_PANEL_LATEST.filter(([key]) => ids[key]).map(([key, icon]) => {
      const s = this._state(ids[key]);
      const a = s?.attributes || {};
      const unknown = !s || s.state === "unavailable" || s.state === "unknown";
      let value = unknown ? "—" : esc(String(s.state).split("\n")[0]);
      if (!unknown && key === "latest_commit" && a.sha) value += `<small>${esc(String(a.sha).slice(0, 7))}</small>`;
      if (!unknown && a.number !== undefined) value += `<small>#${esc(a.number)}</small>`;
      if (!unknown && key === "latest_release" && a.tag && a.tag !== s.state) value += `<small>${esc(a.tag)}</small>`;
      const label = esc(this._t(`d_${key}`));
      return `<div class="dt-row" data-entity="${esc(ids[key])}" role="button" tabindex="0" title="${label}">
          ${githubPanelIcon(icon)}<span class="k">${label}</span><span class="v">${value}</span>${unknown ? "" : this._ghLink(a.url)}</div>`;
    });
    const latest = rows.length ? `<div class="dt-latest">${rows.join("")}</div>` : "";
    const body = `${this._tilesHtml(ids, GITHUB_PANEL_REPO_STATS)}${latest}`;
    return body ? `<div class="dt">${body}</div>` : "";
  }

  /** The GitHub account (followers, following, public repositories and gists) under the lists: empty without its
   * sensors (disabled by default in the GitHub integration), and its card hidden then. */
  _accountHtml() {
    const ids = this._overview?.account || {};
    if (!Object.values(ids).some((id) => this._state(id))) return "";
    const tiles = this._tilesHtml(ids, GITHUB_PANEL_USER_STATS);
    if (!tiles) return "";
    const login = this._overview?.login || "";
    const label = githubPanelEsc(login ? `${this._t("d_account")} · ${login}` : this._t("d_account"));
    const link = login ? this._ghLink(`https://github.com/${login}`) : "";
    return `<div class="dt"><div><div class="dt-sec">${githubPanelIcon("account")}<span class="label" title="${label}">${label}</span>${link}</div>${tiles}</div></div>`;
  }

  /** Totals of the followed repositories for the head: stars, and open issues and pull requests. */
  _totalsHtml() {
    const sum = (key) => this._sum(key);
    const fmt = (n) => this._compact(n);
    const stars = sum("stargazers_count");
    const issues = sum("issues_count");
    const pulls = sum("pulls_count");
    const parts = [];
    if (stars !== null) parts.push(`<span title="${githubPanelEsc(`${this._t("stars")}: ${stars}`)}">${githubPanelIcon("star")}${fmt(stars)}</span>`);
    if (issues !== null || pulls !== null)
      parts.push(`<span>${githubPanelEsc(this._t("open_n", { n: fmt((issues || 0) + (pulls || 0)) }))}</span>`);
    return parts.join("");
  }

  /** Total downloads of the followed repositories, shown at the foot of the Repositories tab. */
  _downloadsTotalHtml() {
    const values = (this._overview?.followed || [])
      .map((r) => this._number(r, "latest_release_downloads"))
      .filter((v) => v !== null);
    if (!values.length) return "";
    const total = values.reduce((a, b) => a + b, 0);
    let n = String(total);
    try {
      n = new Intl.NumberFormat(this._lang()).format(total);
    } catch (_err) {
      // unknown locale: the plain number
    }
    return `${githubPanelIcon("download")}<span>${githubPanelEsc(this._t("total_downloads", { n }))}</span>`;
  }

  /** Counters of the rows follow the sensors without rebuilding the list (the search field keeps its focus). */
  _updateInfo() {
    const kpis = this.shadowRoot.querySelector?.("#repos .kpis");
    if (kpis) {
      const html = this._kpisHtml();
      if (kpis.innerHTML !== html) kpis.innerHTML = html;
    }
    const slot = this.shadowRoot.querySelector?.("#repos .account-slot");
    if (slot) {
      const html = this._accountHtml();
      if (slot.innerHTML !== html) slot.innerHTML = html;
      slot.closest(".account-card").hidden = !html;
    }
    for (const span of this.shadowRoot.querySelectorAll?.("#repos .info") || []) {
      const html = this._infoHtml(span.dataset.repo);
      if (span.innerHTML !== html) span.innerHTML = html;
    }
    for (const detail of this.shadowRoot.querySelectorAll?.("#repos .detail") || []) {
      const html = this._detailHtml(detail.dataset.repo);
      if (detail.innerHTML !== html) detail.innerHTML = html;
    }
  }

  _bindRepos(host) {
    for (const button of host.querySelectorAll("[data-sort]")) button.addEventListener("click", () => {
      this._sort = GITHUB_PANEL_SORTS.includes(button.dataset.sort) ? button.dataset.sort : "followed";
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
      again?.focus({ preventScroll: true });
      again?.setSelectionRange(at, at);
    });
    for (const box of host.querySelectorAll("input.pick-repo"))
      box.addEventListener("change", () => {
        if (box.checked) this._selected.add(box.dataset.repo);
        else this._selected.delete(box.dataset.repo);
        // Updated in place, not redrawn: the list stays where it was scrolled (Safari jumped to the top)
        const slot = host.querySelector(".pick-acts");
        if (!slot) return this._renderRepos();
        box.closest(".row")?.classList.toggle("sel", box.checked);
        slot.innerHTML = this._pickActsHtml(this._selected.size, this._rows().filter((r) => !r.followed).length);
        for (const button of slot.querySelectorAll("[data-action]"))
          button.addEventListener("click", () => this._repoAction(button.dataset.action, button.dataset.repo));
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
    if (action === "expand") return this._toggleExpand(repo);
    if (action === "unfollow-confirmed") {
      this._confirm = null;
      return this._follow([], [repo]);
    }
    this._renderRepos();
  }

  /** Unfolds `repo` (folding the one open) in place, so the list keeps its scroll; redrawn if a row is missing. */
  _toggleExpand(repo) {
    const before = this._expanded;
    this._expanded = before === repo ? null : repo;
    const host = this.shadowRoot.getElementById?.("repos");
    const rows = [before, this._expanded].filter(Boolean).map((name) => [name, this._repoRow(host, name)]);
    if (!host?.querySelector || rows.some(([, row]) => !row)) return this._renderRepos();
    for (const [name, row] of rows) {
      const open = name === this._expanded;
      row.classList.toggle("open", open);
      for (const b of row.querySelectorAll('[data-action="expand"]')) b.setAttribute("aria-expanded", String(open));
      if (row.nextElementSibling?.classList.contains("detail")) row.nextElementSibling.remove();
      if (open) {
        const detail = document.createElement("div");
        detail.className = "detail";
        detail.dataset.repo = name;
        detail.innerHTML = this._detailHtml(name);
        row.after(detail);
      }
    }
  }

  /** The followed row of `repo` in the Repositories tab, or null. */
  _repoRow(host, repo) {
    for (const b of host?.querySelectorAll?.(".chev[data-repo]") || []) if (b.dataset.repo === repo) return b.closest(".row");
    return null;
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
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    this._updateTabBadges();
    await this._load();
  }

  _navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  // ── Issues and Pull requests tabs ──

  /** Open issues or pull requests across the followed repositories, for the tab badge; null for other tabs or before loading. */
  _tabCount(tab) {
    if (tab !== "issues" && tab !== "pulls") return null;
    if (!this._items || this._items.error) return null;
    return Object.values(this._items.totals || {}).reduce((n, t) => n + (t[tab] || 0), 0);
  }

  /** Refresh the open-count badge on the Issues and Pull requests tabs, after their items load. */
  _updateTabBadges() {
    const root = this.shadowRoot;
    for (const tab of ["issues", "pulls"]) {
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
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    try {
      this._items = await this._hass.callWS({ type: "github_card/items", refresh: true });
    } catch (err) {
      this._items = { issues: [], pulls: [], totals: {}, error: err?.message || String(err) };
    }
    this._itemsBusy = false;
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
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

  // `hideAuthor`: the My pull requests tab, where every pull request is the viewer's own, so "by me" is noise.

  _itemHtml(item, kind, hideAuthor = false) {
    const esc = githubPanelEsc;
    const meta = [
      `${esc(item.repo)} #${esc(item.number)}`,
      item.author && !hideAuthor ? esc(this._t("by", { author: item.author })) : "",
      item.updated ? esc(this._t("updated", { when: this._ago(item.updated) })) : "",
    ].filter(Boolean);
    const pills = [];
    if (kind === "pulls") {
      const review = item.draft
        ? ["muted", "draft"]
        : { APPROVED: ["good", "approved"], CHANGES_REQUESTED: ["bad", "changes_requested"], REVIEW_REQUIRED: ["warn", "review_required"] }[item.review];
      if (review) pills.push(`<span class="rev ${review[0]}">${esc(this._t(review[1]))}</span>`);
      // The rolled-up state of the pull request's checks (My pull requests tab; absent elsewhere)
      const checks = {
        SUCCESS: ["good", "checks_passing"],
        FAILURE: ["bad", "checks_failing"],
        ERROR: ["bad", "checks_failing"],
        PENDING: ["warn", "checks_pending"],
        EXPECTED: ["warn", "checks_pending"],
      }[item.checks];
      if (checks) pills.push(`<span class="rev ${checks[0]}">${esc(this._t(checks[1]))}</span>`);
    }
    for (const label of item.labels || []) {
      const color = /^[0-9a-f]{6}$/i.test(label.color) ? `#${label.color}` : "var(--secondary-text-color)";
      pills.push(`<span class="lbl" style="--c:${color}">${esc(label.name)}</span>`);
    }
    if (item.comments) pills.push(`<span class="com" title="${esc(this._t("comments", { n: item.comments }))}">${githubPanelIcon("comment")}${esc(item.comments)}</span>`);
    const url = /^https:\/\/github\.com\//.test(item.url) ? item.url : `https://github.com/${item.repo}`;
    const tone = item.draft ? "" : kind === "pulls" ? "acc" : "good";
    return `<a class="row item${item.draft ? " draft" : ""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
        <span class="ic ${tone}">${githubPanelIcon(kind === "pulls" ? "pr" : "issue")}</span>
        <div class="who"><span class="n t">${esc(item.title)}</span><span class="s">${meta.join(" · ")}</span></div>
        ${pills.length ? `<span class="cnt">${pills.join("")}</span>` : ""}
      </a>`;
  }

  /** When the items were last fetched, for the header's line: "updated 4 minutes ago". */
  _fetchedLine(data) {
    return data?.fetched_at ? this._t("updated", { when: this._ago(new Date(data.fetched_at * 1000).toISOString()) }) : "";
  }


  _renderItems(kind) {
    const host = this.shadowRoot.getElementById?.(kind);
    if (!host) return;
    githubPanelKeepView(host, () => this._drawItems(kind, host));
  }

  _drawItems(kind, host) {
    const esc = githubPanelEsc;
    const followed = this._overview?.followed || [];
    const icon = kind === "pulls" ? "pr" : "issue";
    const tone = kind === "pulls" ? "" : "var(--tone-good)";
    const top = (pill, sub, body) => `<div class="card top">${this._banner(icon, this._t(kind), pill, sub, tone)}<div class="cbody">${body}</div></div>`;
    // Never fetched yet (pending): the background poller has not delivered the first items.
    if (!this._items || this._items.pending) {
      host.innerHTML = top(null, this._t("loading"), "");
      return;
    }
    if (this._overview && !followed.length) {
      host.innerHTML = top(null, "", `<div class="note">${esc(this._t("no_followed"))}</div>`);
      return;
    }
    const all = this._items[kind] || [];
    const items = this._itemRepo ? all.filter((i) => i.repo === this._itemRepo) : all;
    const totalsAll = this._items.totals || {};
    const totals = Object.entries(totalsAll).filter(([repo]) => !this._itemRepo || repo === this._itemRepo);
    const total = totals.reduce((n, [, t]) => n + (t[kind] || 0), 0);
    const grand = Object.values(totalsAll).reduce((n, t) => n + (t[kind] || 0), 0);
    // Only the repositories with open items get a chip, the busiest first and five at most (there can be dozens of
    // followed repositories); the others are behind "+ N more", with a search that also finds the ones at 0.
    const count = (r) => totalsAll[r]?.[kind] || 0;
    const busy = [...new Set([...followed, ...Object.keys(totalsAll)])]
      .filter((r) => count(r) > 0 || r === this._itemRepo)
      .sort((a, b) => count(b) - count(a) || a.localeCompare(b));
    const quiet = [...new Set([...followed, ...Object.keys(totalsAll)])].filter((r) => !busy.includes(r)).sort((a, b) => a.localeCompare(b));
    const shown = busy.slice(0, 5);
    const rest = busy.slice(5);
    const chip = (repo, label, n, hidden) =>
      `<button class="chip" data-repo="${esc(repo)}" aria-pressed="${repo === (this._itemRepo || "")}"${hidden ? " hidden data-quiet" : ""}>${esc(label)}${n ? ` <em>${esc(this._compact(n))}</em>` : ""}</button>`;
    const more = rest.length || quiet.length
      ? `<details class="more"><summary class="chip">${esc(this._t("more_repos", { n: rest.length }))}${githubPanelIcon("chevron")}</summary><div class="pop">
          <label class="search">${githubPanelIcon("search")}<input type="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}"></label>
          ${rest.map((r) => chip(r, r, count(r))).join("")}${quiet.map((r) => chip(r, r, 0, true)).join("")}</div></details>`
      : "";
    const chips = grand || this._itemRepo
      ? [chip("", this._t("all_repos"), grand)].concat(shown.map((r) => chip(r, r, count(r)))).join("") + (rest.length ? more : "")
      : "";
    const notes = [];
    if (this._items.error) notes.push(`<div class="note bad" role="status">${esc(this._t("items_error", { error: this._items.error }))}</div>`);
    host.innerHTML = `
      ${top({ tone: this._items.error ? "bad" : grand ? (kind === "pulls" ? "" : "good") : "muted", text: this._t("open_n", { n: this._compact(grand) }) }, this._fetchedLine(this._items),
        `<div class="chips">${chips}<span class="grow"></span>${items.length ? `<button class="act quiet" data-action="copy-links">${githubPanelIcon("copy")}${esc(this._t("copy_links"))}</button>` : ""}<button class="act quiet" data-action="refresh"${this._itemsBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}${esc(this._t("refresh"))}</button></div>${notes.join("")}`)}
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("open_n", { n: this._compact(total) }))}</h2></div>
        <div class="rows">${items.length ? items.map((i) => this._itemHtml(i, kind)).join("") : `<div class="note">${esc(this._t(kind === "pulls" ? "no_pulls" : "no_issues"))}</div>`}</div>
      </div>`;
    // The search of "+ N more": the repositories with open items, and those at 0 once their name is typed
    host.querySelector(".more input")?.addEventListener("input", (ev) => {
      const q = ev.target.value.trim().toLowerCase();
      for (const b of host.querySelectorAll(".more .pop .chip")) {
        const match = !q || b.dataset.repo.toLowerCase().includes(q);
        b.hidden = b.hasAttribute("data-quiet") ? !q || !match : !match;
      }
    });
    this._renderHead();
    for (const button of host.querySelectorAll("button.chip"))
      button.addEventListener("click", () => {
        this._itemRepo = button.dataset.repo;
        this._renderItems("issues");
        this._renderItems("pulls");
    this._renderHandle();
      });
    host.querySelector("[data-action=refresh]")?.addEventListener("click", () => this._refreshItems());
    host.querySelector("[data-action=copy-links]")?.addEventListener("click", (ev) => this._copyLinks(items, ev.currentTarget));
  }

  /**
   * The links of the items listed (the repository filter applied), one per line, to the clipboard; the button says
   * "Links copied" for two seconds. Without the Clipboard API (Home Assistant over plain http), through a hidden
   * text area.
   */
  async _copyLinks(items, button) {
    const text = items.map((i) => (/^https:\/\/github\.com\//.test(i.url) ? i.url : `https://github.com/${i.repo}`)).join("\n");
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (_err) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      this.shadowRoot.appendChild(area);
      area.select();
      try {
        ok = document.execCommand("copy");
      } catch (_e) {
        ok = false;
      }
      area.remove();
    }
    if (!ok || !button?.isConnected) return;
    const label = githubPanelEsc(this._t("links_copied"));
    button.innerHTML = `${githubPanelIcon("check")}${label}`;
    clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => {
      if (button.isConnected) button.innerHTML = `${githubPanelIcon("copy")}${githubPanelEsc(this._t("copy_links"))}`;
    }, 2000);
  }

  // ── My pull requests tab ──

  // Load my open pull requests (any repository). The server caches them for a few minutes; the first open of the
  // tab fetches them, the Refresh button (refresh=true) asks GitHub again.
  async _loadMine(refresh = false) {
    if (!this._hass) return;
    this._mineBusy = true;
    this._renderMine();
    try {
      this._mine = await this._hass.callWS({ type: "github_card/mine", refresh });
    } catch (err) {
      this._mine = { pulls: [], error: err?.message || String(err) };
    }
    this._mineBusy = false;
    this._renderMine();
  }


  _renderMine() {
    const host = this.shadowRoot.getElementById?.("mine");
    if (!host) return;
    const esc = githubPanelEsc;
    const top = (pill, sub, body) => `<div class="card top">${this._banner("pr", this._t("mine"), pill, sub)}<div class="cbody">${body}</div></div>`;
    // Not opened yet, or the fetch is in flight: show loading.
    if (!this._mine || this._mine.pending || (this._mineBusy && !this._mine.pulls)) {
      host.innerHTML = top(null, this._t("loading"), "");
      return;
    }
    const pulls = this._mine.pulls || [];
    const notes = [];
    if (this._mine.error) notes.push(`<div class="note bad" role="status">${esc(this._t("items_error", { error: this._mine.error }))}</div>`);
    host.innerHTML = `
      ${top({ tone: this._mine.error ? "bad" : pulls.length ? "" : "muted", text: this._t("open_n", { n: pulls.length }) }, this._fetchedLine(this._mine),
        `<div class="chips"><span class="grow"></span><button class="act quiet" data-action="refresh"${this._mineBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}${esc(this._t("refresh"))}</button></div>${notes.join("")}`)}
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("open_n", { n: pulls.length }))}</h2></div>
        <div class="rows">${pulls.length ? pulls.map((i) => this._itemHtml(i, "pulls", true)).join("") : `<div class="note">${esc(this._t("no_mine"))}</div>`}</div>
      </div>`;
    host.querySelector("[data-action=refresh]")?.addEventListener("click", () => this._loadMine(true));
  }

  // ── Settings tab ──

  _value(key) {
    return key in this._draft ? this._draft[key] : this._settings?.[key];
  }


  _changed() {
    return Object.keys(this._draft).some((k) => this._draft[k] !== this._settings?.[k]);
  }

  /** The Settings header card: its banner says whether the changes are saved. */
  _settingsTop() {
    const changed = this._changed();
    const patterns = this._value("filter") || "";
    // The tab's header opens the first settings card: alone in a card of its own, it was only an icon and a pill
    return `<div class="sethead">${this._banner("cog", this._t("settings"), { tone: changed ? "warn" : "good", text: this._t(changed ? "unsaved" : "up_to_date") }, patterns, "#7a8594")}</div>`;
  }

  _renderSettings() {
    const host = this.shadowRoot.getElementById?.("settings");
    if (!host) return;
    const esc = githubPanelEsc;
    if (!this._settings) {
      host.innerHTML = `<div class="card top">${this._banner("cog", this._t("settings"), null, this._t("loading"), "#7a8594")}</div>`;
      return;
    }
    const toggle = (key, label, hint) => `<label class="row toggle"><div class="who"><span class="n">${esc(this._t(label))}</span>${hint ? `<small>${esc(this._t(hint))}</small>` : ""}</div>
        <input type="checkbox" class="sw" role="switch" data-key="${key}"${this._value(key) ? " checked" : ""}></label>`;
    const minutes = Number(this._value("refresh_minutes") ?? 15);
    const presets = [5, 15, 30, 60];
    const other = this._refreshOther || !presets.includes(minutes);
    const preset = presets
      .map((m) => `<button data-refresh="${m}" aria-pressed="${!other && m === minutes}">${esc(m < 60 ? `${m} min` : `${m / 60} h`)}</button>`)
      .join("");
    const changed = this._changed();
    host.innerHTML = `
      <div class="card list">
        ${this._settingsTop()}
        <div class="lhead"><h2 class="lname">${esc(this._t("s_filter"))}</h2></div>
        <label class="ctl"><span>${esc(this._t("s_patterns"))}</span>
          <div class="field"><input type="text" data-key="filter" value="${esc(this._value("filter"))}" placeholder="juju35/ha-*" spellcheck="false"></div>
          <small>${esc(this._t("s_filter_hint"))}</small></label>
        <div class="rows">${toggle("include_starred", "s_starred", "s_starred_hint")}${toggle("ignore_archived", "s_archived", "s_archived_hint")}</div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("s_group_notify"))}</h2></div>
        <div class="rows">${toggle("notify_issues", "s_notify_issues", "s_notify_hint")}${toggle("notify_pulls", "s_notify_pulls", "")}${toggle("notify_releases", "s_notify_releases", "")}</div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("s_group_refresh"))}</h2></div>
        <div class="interval">
          <div class="seg" role="group" aria-label="${esc(this._t("s_refresh"))}">${preset}<button data-refresh="other" aria-pressed="${other}">${esc(this._t("other"))}</button></div>
          ${other ? `<label class="field" title="${esc(this._t("s_refresh"))}"><input type="number" inputmode="numeric" data-key="refresh_minutes" aria-label="${esc(this._t("s_refresh"))}" min="${GITHUB_PANEL_MIN_REFRESH}" max="${GITHUB_PANEL_MAX_REFRESH}" step="1" value="${esc(String(this._value("refresh_minutes")))}"></label>` : ""}
          <small class="note">${esc(this._t("s_refresh_hint"))}</small>
        </div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("s_group_panel"))}</h2></div>
        <div class="rows"><div class="row toggle"><div class="who"><span class="n">${esc(this._t("s_hide_toolbar"))}</span><small>${esc(this._t("s_hide_toolbar_hint"))}</small></div>
          <div class="seg" role="group" aria-label="${esc(this._t("s_hide_toolbar"))}">${["off", "all", "non_admin"]
            .map((m) => `<button data-hide="${m}" aria-pressed="${githubPanelHideMode(this._value("hide_toolbar")) === m}">${esc(this._t(`hide_${m}`))}</button>`)
            .join("")}</div></div></div>
      </div>
      <div class="card savebar"><button class="act" data-action="save"${changed ? "" : " disabled"}>${esc(this._t("save"))}</button>
        ${changed ? `<button class="act quiet" data-action="revert">${esc(this._t("cancel"))}</button>` : ""}
        <span class="note ${this._saved ? "good" : changed ? "warn" : ""}" role="status">${esc(this._saved ? this._t("saved") : changed ? this._t("unsaved") : "")}</span></div>`;
    for (const input of host.querySelectorAll("input[data-key]")) {
      input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
        this._draft[input.dataset.key] =
          input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
        this._saved = false;
        // Typing only refreshes the header, the button and the message, so the field keeps its focus
        const now = this._changed();
        const save = host.querySelector("[data-action=save]");
        if (save) save.disabled = !now;
        const note = host.querySelector(".savebar .note");
        if (note) {
          note.className = `note ${now ? "warn" : ""}`;
          note.textContent = now ? this._t("unsaved") : "";
        }
        const top = host.querySelector(".sethead");
        if (top && (top.dataset.changed !== String(now) || input.dataset.key === "filter")) {
          top.outerHTML = this._settingsTop();
          host.querySelector(".sethead").dataset.changed = String(now);
        }
      });
    }
    for (const button of host.querySelectorAll("[data-refresh]"))
      button.addEventListener("click", () => {
        if (button.dataset.refresh === "other") this._refreshOther = true;
        else {
          this._refreshOther = false;
          this._draft.refresh_minutes = Number(button.dataset.refresh);
          this._saved = false;
        }
        this._renderSettings();
      });
    for (const button of host.querySelectorAll("[data-hide]"))
      button.addEventListener("click", () => {
        this._draft.hide_toolbar = button.dataset.hide;
        if (this._draft.hide_toolbar === this._settings?.hide_toolbar) delete this._draft.hide_toolbar;
        this._saved = false;
        this._renderSettings();
      });
    host.querySelector("[data-action=save]")?.addEventListener("click", () => this._save());
    host.querySelector("[data-action=revert]")?.addEventListener("click", () => {
      this._draft = {};
      this._refreshOther = false;
      this._renderSettings();
    });
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
        this._syncBare();
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
