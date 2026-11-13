// The README screenshots rendered by scripts/screenshots.mjs: one entry per PNG in screenshots/.
// Every screenshot is rendered in both themes from one setup, so a light/dark pair shows exactly the same state.
const pairs = [
  { light: "card", dark: "card-dark", type: "github-card", width: 460, config: {}, open: "dev_core" },
  { light: "card-single", dark: "card-single-dark", type: "github-card", width: 460, config: { title: "ha-parcel", repositories: ["juju35/ha-parcel"], show_account: false } },
  { light: "card-empty", dark: "card-empty-dark", type: "github-card", width: 460, config: {}, accountOnly: true },
  { light: "panel-repos", dark: "panel-repos-dark", width: 820, panel: "repos", expand: "juju35/ha-parcel", select: ["juju35/ha-calendar-card", "juju35/ha-iptv"] },
  { light: "panel-issues", dark: "panel-issues-dark", width: 820, panel: "issues" },
  { light: "panel-pulls", dark: "panel-pulls-dark", width: 820, panel: "pulls" },
  { light: "panel-settings", dark: "panel-settings-dark", width: 820, panel: "settings" },
  { light: "mini-card", dark: "mini-card-dark", type: "github-mini-card", width: 380, config: {} },
  { light: "mini-card-zoom", dark: "mini-card-zoom-dark", type: "github-mini-card", width: 460, config: {}, zoom: "dev_parcel" },
];

export const shots = pairs.flatMap(({ light, dark, ...setup }) => [
  { file: light, theme: "light", ...setup },
  { file: dark, theme: "dark", ...setup },
]);
