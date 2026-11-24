import { GITHUB_PANEL_TRANSLATIONS } from "./i18n/github-panel-translations.js";
import { GITHUB_PANEL_KEYS } from "./core.js";

export const GITHUB_PANEL_STRINGS = Object.fromEntries(
  Object.entries(GITHUB_PANEL_TRANSLATIONS).map(([l, list]) => [l, Object.fromEntries(GITHUB_PANEL_KEYS.map((k, i) => [k, list[i]]))]),
);

// The top bar choice: off, all (hidden for everyone) or non_admin; a switch saved by an older version: on, for everyone
export const githubPanelHideMode = (value) =>
  value === true ? "all" : value === "all" || value === "non_admin" ? value : "off";

export const githubPanelEsc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A selector finding again, after a redraw, the control that had the focus (its tag, first class and data-*), or null.
export const githubPanelFocusKey = (el) => {
  const q = (v) => String(v).replace(/["\\]/g, "\\$&");
  const attrs = [...(el.attributes || [])].filter((a) => a.name.startsWith("data-")).map((a) => `[${a.name}="${q(a.value)}"]`);
  const cls = el.classList?.[0] ? `[class~="${q(el.classList[0])}"]` : "";
  return attrs.length || cls ? `${el.localName}${cls}${attrs.join("")}` : null;
};

// Sets `node`'s markup only when `html` differs from the markup it was last given (the browser's own serialisation
// never matches the string: `<path/>` reads back `<path></path>`), so that a Home Assistant update with nothing new
// leaves the page alone. Returns true when the node was rewritten.
export const githubPanelSetHtml = (node, html) => {
  if (!node || node._ghHtml === html) return false;
  node._ghHtml = html;
  node.innerHTML = html;
  return true;
};

// Redraws `host` with `draw` keeping the page where it was scrolled and the focus on the same control: Safari (no
// scroll anchoring) sent the page back to the top when a tab was rebuilt under the pointer. Every scrolled ancestor,
// across the shadow roots up to the document, gets its position back.
export const githubPanelKeepView = (host, draw) => {
  const scrolled = [];
  for (let n = host; n; n = n.parentNode || n.host) if (n.nodeType === 1 && n.scrollTop > 0) scrolled.push([n, n.scrollTop]);
  const root = host.getRootNode?.();
  const active = root?.activeElement;
  const key = active && host.contains?.(active) && active.type !== "search" ? githubPanelFocusKey(active) : null;
  draw();
  if (key) host.querySelector?.(key)?.focus?.({ preventScroll: true });
  if (!scrolled.length) return;
  for (const [n, top] of scrolled) if (n.scrollTop !== top) n.scrollTop = top;
  // A jump back to the top after the redraw (the browser settling the layout) is undone too; a scroll by the user is not
  if (typeof requestAnimationFrame === "function")
    requestAnimationFrame(() => {
      for (const [n, top] of scrolled) if (n.scrollTop === 0) n.scrollTop = top;
    });
};

// mdi paths used by the panel (ha-icon is avoided so that the screenshots and tests need no frontend)
export const GITHUB_PANEL_ICONS = {
  code: "M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z",
  open: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  cog: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  issue: "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5Z",
  pr: "M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V15.17C8.17,15.58 9,16.69 9,18A3,3 0 0,1 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M21,18A3,3 0 0,1 18,21A3,3 0 0,1 15,18C15,16.69 15.83,15.58 17,15.17V7H15V10.25L10.75,6L15,1.75V5H17A2,2 0 0,1 19,7V15.17C20.17,15.58 21,16.69 21,18M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17Z",
  chevron: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  star: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z",
  tag: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  comment: "M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
  download: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  // The unfolded repository's counters and latest activity, and the account
  fork: "M6,2A3,3 0 0,1 9,5C9,6.28 8.19,7.38 7.06,7.81C7.15,8.27 7.39,8.83 8,9.63C9,10.92 11,12.83 12,14.17C13,12.83 15,10.92 16,9.63C16.61,8.83 16.85,8.27 16.94,7.81C15.81,7.38 15,6.28 15,5A3,3 0 0,1 18,2A3,3 0 0,1 21,5C21,6.32 20.14,7.45 18.95,7.85C18.87,8.37 18.64,9 18,9.83C17,11.17 15,13.08 14,14.38C13.39,15.17 13.15,15.73 13.06,16.19C14.19,16.62 15,17.72 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.72 9.81,16.62 10.94,16.19C10.85,15.73 10.61,15.17 10,14.38C9,13.08 7,11.17 6,9.83C5.36,9 5.13,8.37 5.05,7.85C3.86,7.45 3,6.32 3,5A3,3 0 0,1 6,2M6,4A1,1 0 0,0 5,5A1,1 0 0,0 6,6A1,1 0 0,0 7,5A1,1 0 0,0 6,4M18,4A1,1 0 0,0 17,5A1,1 0 0,0 18,6A1,1 0 0,0 19,5A1,1 0 0,0 18,4M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z",
  eye: "M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z",
  merge: "M7,3A3,3 0 0,1 10,6C10,7.29 9.19,8.39 8.04,8.81C8.58,13.81 13.08,14.77 15.19,14.96C15.61,13.81 16.71,13 18,13A3,3 0 0,1 21,16A3,3 0 0,1 18,19C16.69,19 15.57,18.16 15.16,17C10.91,16.8 9.44,15.19 8,13.39V15.17C9.17,15.58 10,16.69 10,18A3,3 0 0,1 7,21A3,3 0 0,1 4,18C4,16.69 4.83,15.58 6,15.17V8.83C4.83,8.42 4,7.31 4,6A3,3 0 0,1 7,3M7,5A1,1 0 0,0 6,6A1,1 0 0,0 7,7A1,1 0 0,0 8,6A1,1 0 0,0 7,5M7,17A1,1 0 0,0 6,18A1,1 0 0,0 7,19A1,1 0 0,0 8,18A1,1 0 0,0 7,17M18,15A1,1 0 0,0 17,16A1,1 0 0,0 18,17A1,1 0 0,0 19,16A1,1 0 0,0 18,15Z",
  forum: "M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z",
  release: "M12,2L3,7V17L12,22L21,17V7L12,2M12,4.31L18.47,7.9L12,11.5L5.53,7.9L12,4.31M5,9.6L11,12.94V19.6L5,16.27V9.6M13,19.6V12.94L19,9.6V16.27L13,19.6Z",
  commit: "M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12C7,9.58 8.72,7.56 11,7.1V3H13V7.1C15.28,7.56 17,9.58 17,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z",
  group: "M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z",
  account: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
};
// The tabs' illustrated banner (90 px, as the headers of the ha-* cards): a desk with a screen showing a branch
// graph (the latest commit breathing), a mug and a plant on a parquet strip; night colours with a dark theme.
export const GITHUB_PANEL_SCENE = `<svg class="scene" viewBox="0 0 360 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
<rect class="s-desk" x="90" y="56" width="200" height="5" rx="1"/><rect class="s-deskd" x="98" y="61" width="5" height="19"/><rect class="s-deskd" x="277" y="61" width="5" height="19"/>
<rect class="s-mon" x="140" y="8" width="96" height="44" rx="4"/><rect class="s-scr" x="144" y="12" width="88" height="34" rx="2"/><rect class="s-mon" x="183" y="52" width="10" height="4"/>
<path d="M152 29H222" stroke="#8957e5" stroke-width="2.2" fill="none"/><path d="M168 29C174 29 174 20 180 20H200C206 20 206 29 212 29" stroke="#43a047" stroke-width="2.2" fill="none"/>
<circle cx="152" cy="29" r="3.2" fill="#8957e5"/><circle cx="168" cy="29" r="3.2" fill="#8957e5"/><circle cx="186" cy="20" r="3.2" fill="#43a047"/><circle cx="198" cy="20" r="3.2" fill="#43a047"/><circle cx="212" cy="29" r="3.2" fill="#8957e5"/>
<circle class="s-pulse" cx="222" cy="29" r="3.6" fill="none" stroke="#8957e5" stroke-width="2"/>
<rect class="s-mug" x="250" y="44" width="12" height="12" rx="2" stroke-width="1.4"/><path class="s-handle" d="M262 47h3a3 3 0 0 1 0 6h-3" fill="none" stroke-width="1.4"/>
<rect class="s-pot" x="310" y="60" width="16" height="20" rx="2"/><path class="s-leaf" d="M318 60C310 48 307 39 310 30C316 39 318 48 318 60ZM318 60C323 47 329 42 335 40C331 49 326 56 318 60Z"/>
</svg><div class="ground" aria-hidden="true"></div>`;

// The unfolded repository's counters (sensor key, label key, icon, colour) and latest activity (sensor key, icon),
// and the account's counters, as the GitHub Card shows them.
export const GITHUB_PANEL_REPO_STATS = [
  ["stargazers_count", "d_stars", "star", "star"],
  ["forks_count", "d_forks", "fork", "blue"],
  ["subscribers_count", "d_watchers", "eye", "blue"],
  ["issues_count", "d_issues", "issue", "green"],
  ["pulls_count", "d_pulls", "pr", "green"],
  ["merged_pulls_count", "d_merged_pulls", "merge", "purple"],
  ["discussions_count", "d_discussions", "forum", "blue"],
  ["latest_release_downloads", "d_downloads", "download", "blue"],
];
export const GITHUB_PANEL_LATEST = [
  ["latest_release", "release"],
  ["latest_tag", "tag"],
  ["latest_commit", "commit"],
  ["latest_pull_request", "pr"],
  ["latest_issue", "issue"],
  ["latest_discussion", "forum"],
];
export const GITHUB_PANEL_USER_STATS = [
  ["followers", "d_followers", "group", "blue"],
  ["following", "d_following", "account", "blue"],
  ["public_repos", "d_public_repos", "code", "blue"],
  ["public_gists", "d_public_gists", "code", "blue"],
];

export const githubPanelIcon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${GITHUB_PANEL_ICONS[name]}"/></svg>`;
