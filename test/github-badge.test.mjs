// Unit tests for the sidebar badge module: the open issues / pull requests count on the GitHub panel item, and its
// tone (amber when an issue is open, the accent when only pull requests are).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../custom_components/github_card/frontend/github-badge.js", import.meta.url), "utf8");

function load() {
  const context = {
    window: {},
    document: { hidden: false, querySelector: () => null },
    requestAnimationFrame: (fn) => fn(),
    setTimeout: () => 0,
    setInterval: () => 0,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.follow = ghbFollow;\nthis.redraw = ghbBadgeRedraw;`, context);
  return context;
}

function matchEl(el, sel) {
  if (sel.startsWith(":scope > ")) {
    const rest = sel.slice(9);
    return el.children.filter((c) => matchEl(c, rest));
  }
  if (sel === ".github-card-badge") return (el.className || "").includes("github-card-badge") ? [el] : [];
  const slot = sel.match(/^(ha-svg-icon|ha-icon)\[slot="start"\]$/);
  if (slot) return el.localName === slot[1] && el.slot === "start" ? [el] : [];
  return [];
}

function makeEl(localName, props = {}) {
  return {
    localName,
    children: [],
    style: {},
    dataset: {},
    ...props,
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, ref) {
      child.parent = this;
      const i = ref ? this.children.indexOf(ref) : -1;
      if (i < 0) this.children.push(child);
      else this.children.splice(i, 0, child);
      return child;
    },
    get nextSibling() {
      const sibs = this.parent ? this.parent.children : [];
      return sibs[sibs.indexOf(this) + 1] || null;
    },
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    },
    querySelector(sel) {
      return matchEl(this, sel)[0] || null;
    },
    querySelectorAll(sel) {
      return matchEl(this, sel);
    },
  };
}

function withSidebar(context, item) {
  const saved = {};
  context.localStorage = { getItem: (k) => saved[k] ?? null, setItem: (k, v) => (saved[k] = v) };
  context.document.createElement = () => makeEl("span");
  const sidebarShadow = { querySelector: (s) => (s === "#sidebar-panel-github-config" ? item : null) };
  const haRoot = {
    querySelector: (s) =>
      s === "home-assistant-main"
        ? { shadowRoot: { querySelector: (s2) => (s2 === "ha-sidebar" ? { shadowRoot: sidebarShadow } : null) } }
        : null,
  };
  context.document.querySelector = (s) => (s === "home-assistant" ? { shadowRoot: haRoot } : null);
  return saved;
}

function badgesOf(item) {
  return item.children.filter((c) => (c.className || "").includes("github-card-badge"));
}

test("the sidebar badge: the count at the right of an older <a> item, removed at zero", () => {
  const context = load();
  const item = makeEl("a");
  const saved = withSidebar(context, item);
  // An open issue: the amber (warning) tone with dark text
  context.window.ghCardSetBadge(4, "warn");
  const badge = item.children[0];
  assert.equal(badge.textContent, "4");
  assert.match(badge.style.cssText, /position:absolute/);
  assert.match(badge.style.cssText, /--warning-color/);
  assert.match(badge.style.cssText, /rgba\(0,0,0,\.87\)/);
  assert.equal(item.style.position, "relative");
  assert.equal(saved["github-card-badge-count"], "4");
  assert.equal(saved["github-card-badge-tone"], "warn");
  // Over 99 is capped
  context.window.ghCardSetBadge(150, "warn");
  assert.equal(item.children[0].textContent, "99+");
  // Nothing open: the badge is taken away
  context.window.ghCardSetBadge(0, "primary");
  assert.equal(item.children.length, 0);
});

test("the sidebar badge: two slots on a new ha-list-item-button, mirroring the notifications badge", () => {
  const context = load();
  const item = makeEl("ha-list-item-button", { id: "sidebar-panel-github-config" });
  const icon = makeEl("ha-icon", { slot: "start" });
  item.appendChild(icon);
  item.appendChild(makeEl("span", { slot: "headline" }));
  withSidebar(context, item);
  // Only pull requests open: the accent tone with white text
  context.window.ghCardSetBadge(7, "primary");
  const badges = badgesOf(item);
  assert.equal(badges.length, 2);
  assert.deepEqual(badges.map((b) => b.slot).sort(), ["end", "start"]);
  for (const b of badges) {
    assert.match(b.className, /\bbadge\b/);
    assert.equal(b.textContent, "7");
    assert.match(b.style.cssText, /--primary-color/);
    assert.match(b.style.cssText, /color:#fff/);
  }
  // The start badge sits right after the icon (so `ha-svg-icon + .badge` positions it over the icon)
  assert.equal(item.children[item.children.indexOf(icon) + 1].slot, "start");
  // The same count and tone: nothing rewritten
  const key = badges[0].dataset.key;
  context.window.ghCardSetBadge(7, "primary");
  assert.equal(badgesOf(item)[0].dataset.key, key);
});

test("the tone follows the open issues: amber with an issue, the accent with only pull requests", async () => {
  const context = load();
  const item = makeEl("ha-list-item-button", { id: "sidebar-panel-github-config" });
  item.appendChild(makeEl("ha-icon", { slot: "start" }));
  withSidebar(context, item);
  const result = { totals: {} };
  const hass = { user: { is_admin: true }, callWS: async () => result };
  context.document.querySelector = ((orig) => (s) => (s === "home-assistant" ? { ...orig(s), hass } : orig(s)))(
    context.document.querySelector,
  );

  // Open issues and pull requests: the total is their sum, in the amber tone
  result.totals = { "a/b": { issues: 2, pulls: 1 }, "c/d": { issues: 3, pulls: 0 } };
  await context.follow();
  assert.equal(context.window.__ghCardBadge.count, 6);
  assert.equal(context.window.__ghCardBadge.tone, "warn");
  assert.match(badgesOf(item)[0].style.cssText, /--warning-color/);

  // Only pull requests (no open issue): the accent tone
  result.totals = { "a/b": { issues: 0, pulls: 4 } };
  await context.follow();
  assert.equal(context.window.__ghCardBadge.count, 4);
  assert.equal(context.window.__ghCardBadge.tone, "primary");
  assert.match(badgesOf(item)[0].style.cssText, /--primary-color/);

  // Not an administrator, or GitHub not configured: nothing read
  hass.user.is_admin = false;
  context.window.ghCardSetBadge(0, "primary");
  await context.follow();
  assert.equal(context.window.__ghCardBadge.count, 0);
});
