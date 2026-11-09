// The README screenshots rendered by scripts/screenshots.mjs: one entry per PNG in screenshots/.
// Every screenshot is rendered in both themes from one setup, so a light/dark pair shows exactly the same state.
const pairs = [
  { light: "card", dark: "card-dark", type: "github-card", width: 460, config: {}, open: "dev_core" },
  { light: "card-single", dark: "card-single-dark", type: "github-card", width: 460, config: { title: "ha-parcel", repositories: ["juju35/ha-parcel"], show_account: false } },
  { light: "mini-card", dark: "mini-card-dark", type: "github-mini-card", width: 380, config: {} },
  { light: "mini-card-zoom", dark: "mini-card-zoom-dark", type: "github-mini-card", width: 460, config: {}, zoom: "dev_parcel" },
];

export const shots = pairs.flatMap(({ light, dark, ...setup }) => [
  { file: light, theme: "light", ...setup },
  { file: dark, theme: "dark", ...setup },
]);
