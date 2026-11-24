// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { GitHubCard, GitHubMiniCard } from "./cards.js";
import { GitHubCardEditor, GitHubMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("github-card", GitHubCard);
define("github-mini-card", GitHubMiniCard);
define("github-card-editor", GitHubCardEditor);
define("github-mini-card-editor", GitHubMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  { type: "github-card", name: "GitHub Card", description: "Your GitHub repositories: stars, forks, open issues and pull requests, latest release, commit and activity." },
  { type: "github-mini-card", name: "GitHub Mini Card", description: "Compact overview of your GitHub repositories: totals and one line per repository." },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-github" });
}

console.info(`%c GITHUB-CARD %c v${VERSION} `, "color: white; background: #8957e5; font-weight: 700;", "color: #8957e5; background: white; font-weight: 700;");
