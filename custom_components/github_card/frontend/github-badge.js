// GitHub Card sidebar badge, loaded on every page: the number of open issues and pull requests of the followed
// repositories (github_card/items) on the sidebar item, like the notifications count. An administrator's page reads
// the total every 5 minutes (from the 5-minute server cache, no extra GitHub call), and the browser keeps the last
// one so the sidebar shows it at once. One badge with the total, its colour set by the open issues: amber (the
// `warning` tone) when at least one issue is open, the accent otherwise (only pull requests open).
const GHB_COUNT_KEY = "github-card-badge-count";
const GHB_TONE_KEY = "github-card-badge-tone";
const GHB_EVERY_MS = 300000;
// warn: at least one open issue; primary: only open pull requests.
const GHB_COLORS = {
  warn: "var(--warning-color, #ffa600)",
  primary: "var(--primary-color)",
};
// Dark text reads on the amber badge, white on the accent.
const GHB_TEXT = { warn: "rgba(0,0,0,.87)", primary: "#fff" };

function ghbBadgeSaved() {
  try {
    const n = Number.parseInt(localStorage.getItem(GHB_COUNT_KEY), 10);
    const tone = localStorage.getItem(GHB_TONE_KEY);
    return { count: Number.isFinite(n) && n > 0 ? n : 0, tone: tone in GHB_COLORS ? tone : "primary" };
  } catch (_err) {
    return { count: 0, tone: "primary" };
  }
}
window.__ghCardBadge ??= ghbBadgeSaved();

// The GitHub item in Home Assistant's sidebar, or null until the sidebar is drawn. The recent sidebar gives each item
// the id `sidebar-panel-<path>` and sets its href as a property (not an attribute), so the id is the reliable hook;
// `[href]` and `[data-panel]` catch the older sidebars (an <a> wrapping a paper-icon-item).
function ghbSidebarItem() {
  const ha = document.querySelector("home-assistant")?.shadowRoot;
  const sidebar = ha?.querySelector("home-assistant-main")?.shadowRoot?.querySelector("ha-sidebar")?.shadowRoot;
  if (!sidebar) return null;
  return (
    sidebar.querySelector("#sidebar-panel-github-config") ||
    sidebar.querySelector('[href="/github-config"]') ||
    sidebar.querySelector('[data-panel="github-config"]')
  );
}

// One badge span, styled as Home Assistant's own sidebar badge (class `badge`, so the sidebar's CSS places it and
// shows or hides it by slot and expanded state), in the badge's tone.
function ghbBadgeSpan(text, tone, slot, key) {
  const el = document.createElement("span");
  el.className = "badge github-card-badge";
  el.slot = slot;
  el.dataset.key = key;
  el.textContent = text;
  // The start badge (shown collapsed, over the icon) is placed by Home Assistant's `ha-svg-icon + .badge` rule — but a
  // custom panel's sidebar icon is an <ha-icon>, not a bare <ha-svg-icon>, so that rule does not match and the badge
  // would sit in the start slot and push the panel label to the right. Position it ourselves (over the icon, like
  // Home Assistant's own: top var(--ha-space-1), left 26px) so it never affects the row's layout; the end badge stays
  // in flow at the trailing edge. The host's expanded/collapsed opacity rules still show the right one by slot.
  const place = slot === "start" ? "position:absolute; top:var(--ha-space-1, 4px); left:26px; z-index:1; pointer-events:none; " : "";
  el.style.cssText = `${place}display:inline-flex; justify-content:center; min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; align-items:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; color:${GHB_TEXT[tone] || "#fff"}; background:${GHB_COLORS[tone]};`;
  return el;
}

// The badge on the sidebar item: the number of open issues and pull requests, like the notifications count; none when
// there are none. On the recent sidebar (ha-list-item-button / ha-md-list-item) it mirrors Home Assistant's own badge
// — a span in the start slot (shown when the sidebar is collapsed, over the icon) and one in the end slot (shown when
// expanded) — so the sidebar's CSS handles the placement and the collapsed/expanded switch. On the older sidebar (an
// <a>) a single span is placed at the right. Redrawn when Home Assistant rebuilds its items; unchanged, it writes
// nothing (so the observer below does not loop).
function ghbBadgeRedraw() {
  const item = ghbSidebarItem();
  if (!item) return false;
  const count = window.__ghCardBadge.count;
  const tone = window.__ghCardBadge.tone;
  const spans = item.querySelectorAll(":scope > .github-card-badge");
  if (!count) {
    for (const b of spans) b.remove();
    return true;
  }
  const text = count > 99 ? "99+" : String(count);
  const key = `${tone}:${text}`;
  if (item.localName === "a") {
    let badge = spans[0];
    if (badge && badge.dataset.key === key) return true;
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "github-card-badge";
      item.style.position = "relative";
      item.appendChild(badge);
    }
    badge.dataset.key = key;
    badge.textContent = text;
    badge.style.cssText = `position:absolute; right:12px; top:50%; transform:translateY(-50%); min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; pointer-events:none; z-index:1; color:${GHB_TEXT[tone] || "#fff"}; background:${GHB_COLORS[tone]};`;
    return true;
  }
  if (spans.length === 2 && spans[0].dataset.key === key) return true;
  for (const old of spans) old.remove();
  // The start badge goes right after the icon, so the sidebar's `ha-svg-icon + .badge` rule places it over the icon.
  const icon =
    item.querySelector(':scope > ha-svg-icon[slot="start"]') || item.querySelector(':scope > ha-icon[slot="start"]');
  const start = ghbBadgeSpan(text, tone, "start", key);
  if (icon) item.insertBefore(start, icon.nextSibling);
  else item.appendChild(start);
  item.appendChild(ghbBadgeSpan(text, tone, "end", key));
  return true;
}

// Until the sidebar has drawn the item (it may come after this module): every 250 ms for 5 seconds
function ghbBadgeRedrawSoon(tries = 20) {
  if (ghbBadgeRedraw() || tries <= 1) return;
  setTimeout(() => ghbBadgeRedrawSoon(tries - 1), 250);
}

// The sidebar rebuilds its items (opened, folded, panels changed): the badge is added again when it is dropped
function ghbBadgeObserve() {
  const item = ghbSidebarItem();
  const sidebar = item?.getRootNode();
  if (!sidebar) {
    setTimeout(ghbBadgeObserve, 500);
    return;
  }
  if (sidebar.__ghCardBadgeObserved) return;
  sidebar.__ghCardBadgeObserved = true;
  new MutationObserver(() => {
    if (window.__ghCardBadgeRaf) return;
    window.__ghCardBadgeRaf = requestAnimationFrame(() => {
      window.__ghCardBadgeRaf = 0;
      ghbBadgeRedraw();
    });
  }).observe(sidebar, { childList: true, subtree: true });
}

// The total and its tone, drawn again when either changes and kept for the next page
window.ghCardSetBadge = (count, tone) => {
  const n = Math.max(0, Number.parseInt(count, 10) || 0);
  const t = tone in GHB_COLORS ? tone : "primary";
  if (window.__ghCardBadge.count === n && window.__ghCardBadge.tone === t) return;
  window.__ghCardBadge = { count: n, tone: t };
  try {
    localStorage.setItem(GHB_COUNT_KEY, String(n));
    localStorage.setItem(GHB_TONE_KEY, t);
  } catch (_err) {
    // drawn anyway, not kept
  }
  ghbBadgeRedraw();
};

// Reads the open issues and pull requests of the followed repositories (github_card/items) for an administrator, and
// reports their total with a tone set by the open issues. The counts come from the per-repository totals (the open
// counts), not the lists, which are capped. GitHub not configured, or no repository followed: nothing is shown.
async function ghbFollow() {
  const hass = document.querySelector("home-assistant")?.hass;
  if (!hass?.user?.is_admin || document.hidden) return;
  try {
    const items = await hass.callWS({ type: "github_card/items", refresh: false });
    if (items?.error) return;
    const totals = Object.values(items?.totals || {});
    const issues = totals.reduce((sum, t) => sum + (t.issues || 0), 0);
    const pulls = totals.reduce((sum, t) => sum + (t.pulls || 0), 0);
    window.ghCardSetBadge(issues + pulls, issues > 0 ? "warn" : "primary");
  } catch (_err) {
    // read again next time
  }
}

if (!window.__ghCardBadgeStarted) {
  window.__ghCardBadgeStarted = true;
  ghbBadgeRedrawSoon();
  ghbBadgeObserve();
  // The total read a few seconds after the page, once Home Assistant has drawn it, then every 5 minutes
  setTimeout(ghbFollow, 5000);
  setInterval(ghbFollow, GHB_EVERY_MS);
}
