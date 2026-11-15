// GitHub Card sidebar badge, loaded on every page: the number of open issues and pull requests of the followed
// repositories (github_card/items) on the sidebar item, like the notifications count. An administrator's page reads
// the total every 5 minutes (from the 5-minute server cache, no extra GitHub call), and the browser keeps the last
// one so the sidebar shows it at once. GitHub has no status or severity, so the badge is a single accent tone.
const GHB_COUNT_KEY = "github-card-badge-count";
const GHB_COLOR = "var(--primary-color)";
const GHB_EVERY_MS = 300000;

function ghbCountSaved() {
  try {
    const n = Number.parseInt(localStorage.getItem(GHB_COUNT_KEY), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (_err) {
    return 0;
  }
}
window.__ghCardBadgeCount ??= ghbCountSaved();

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
// shows or hides it by slot and expanded state).
function ghbBadgeSpan(text, slot, key) {
  const el = document.createElement("span");
  el.className = "badge github-card-badge";
  el.slot = slot;
  el.dataset.key = key;
  el.textContent = text;
  el.style.cssText = `min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; align-items:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; color:#fff; background:${GHB_COLOR};`;
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
  const count = window.__ghCardBadgeCount;
  const spans = item.querySelectorAll(":scope > .github-card-badge");
  if (!count) {
    for (const b of spans) b.remove();
    return true;
  }
  const text = count > 99 ? "99+" : String(count);
  const key = text;
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
    badge.style.cssText = `position:absolute; right:12px; top:50%; transform:translateY(-50%); min-width:18px; height:18px; box-sizing:border-box; padding:0 5px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; font-size:11px; font-weight:500; line-height:1; pointer-events:none; z-index:1; color:#fff; background:${GHB_COLOR};`;
    return true;
  }
  if (spans.length === 2 && spans[0].dataset.key === key) return true;
  for (const old of spans) old.remove();
  // The start badge goes right after the icon, so the sidebar's `ha-svg-icon + .badge` rule places it over the icon.
  const icon =
    item.querySelector(':scope > ha-svg-icon[slot="start"]') || item.querySelector(':scope > ha-icon[slot="start"]');
  const start = ghbBadgeSpan(text, "start", key);
  if (icon) item.insertBefore(start, icon.nextSibling);
  else item.appendChild(start);
  item.appendChild(ghbBadgeSpan(text, "end", key));
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

// The total, drawn again when it changes and kept for the next page
window.ghCardSetBadge = (count) => {
  const n = Math.max(0, Number.parseInt(count, 10) || 0);
  if (window.__ghCardBadgeCount === n) return;
  window.__ghCardBadgeCount = n;
  try {
    localStorage.setItem(GHB_COUNT_KEY, String(n));
  } catch (_err) {
    // drawn anyway, not kept
  }
  ghbBadgeRedraw();
};

// Reads the open issues and pull requests of the followed repositories (github_card/items) for an administrator, and
// reports their total. The count comes from the per-repository totals (the open counts), not the lists, which are
// capped. GitHub not configured, or no repository followed: nothing is shown.
async function ghbFollow() {
  const hass = document.querySelector("home-assistant")?.hass;
  if (!hass?.user?.is_admin || document.hidden) return;
  try {
    const items = await hass.callWS({ type: "github_card/items", refresh: false });
    if (items?.error) return;
    const total = Object.values(items?.totals || {}).reduce((sum, t) => sum + (t.issues || 0) + (t.pulls || 0), 0);
    window.ghCardSetBadge(total);
  } catch (_err) {
    // read again next time
  }
}

if (!window.__ghCardBadge) {
  window.__ghCardBadge = true;
  ghbBadgeRedrawSoon();
  ghbBadgeObserve();
  // The total read a few seconds after the page, once Home Assistant has drawn it, then every 5 minutes
  setTimeout(ghbFollow, 5000);
  setInterval(ghbFollow, GHB_EVERY_MS);
}
