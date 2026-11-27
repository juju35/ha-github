// The README screenshots rendered by scripts/screenshots.mjs: one entry per PNG in screenshots/.
// Every screenshot is rendered in both themes from one setup, so a light/dark pair shows exactly the same state.
const pairs = [
  { light: "card", dark: "card-dark", type: "github-card", width: 460, config: {}, open: "dev_core" },
  { light: "card-single", dark: "card-single-dark", type: "github-card", width: 460, config: { title: "ha-parcel", repositories: ["juju35/ha-parcel"], show_account: false } },
  { light: "card-empty", dark: "card-empty-dark", type: "github-card", width: 460, config: {}, accountOnly: true },
  { light: "panel-repos", dark: "panel-repos-dark", width: 820, panel: "repos", expand: "juju35/ha-parcel", select: ["juju35/ha-calendar-card", "juju35/ha-iptv"] },
  { light: "panel-issues", dark: "panel-issues-dark", width: 820, panel: "issues" },
  { light: "panel-pulls", dark: "panel-pulls-dark", width: 820, panel: "pulls" },
  { light: "panel-mine", dark: "panel-mine-dark", width: 820, panel: "mine" },
  { light: "panel-branches", dark: "panel-branches-dark", width: 820, panel: "branches", branches: ["juju35/ha-parcel\nfeat/carrier-logos", "juju35/ha-iptv\nci/manual-release"] },
  { light: "panel-create", dark: "panel-create-dark", width: 820, panel: "create", form: { name: "ha-example-card", description: "Lovelace card for Home Assistant", topics: "home-assistant, lovelace, hacs" } },
  { light: "panel-settings", dark: "panel-settings-dark", width: 820, panel: "settings" },
  { light: "mini-card", dark: "mini-card-dark", type: "github-mini-card", width: 380, config: {} },
  { light: "mini-card-zoom", dark: "mini-card-zoom-dark", type: "github-mini-card", width: 460, config: {}, zoom: "dev_parcel" },
  // The sidebar entry with the count badge: the open issues plus pull requests, amber when there are open issues.
  { light: "sidebar", dark: "sidebar-dark", sidebar: true, width: 256 },
];

export const shots = pairs.flatMap(({ light, dark, ...setup }) => [
  { file: light, theme: "light", ...setup },
  { file: dark, theme: "dark", ...setup },
]);
