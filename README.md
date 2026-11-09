# ha-github-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-github-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-github-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-github-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-github-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-github-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-github-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-github-card)](https://github.com/juju35/ha-github-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-github-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/images/github-card.svg" alt="GitHub Card" width="120"></p>

Lovelace cards for Home Assistant showing your GitHub repositories: stars, forks, open issues and pull requests, and the latest release, commit, pull request and issue of each one.

The cards are built on top of the core [GitHub integration](https://www.home-assistant.io/integrations/github/): entities are **discovered automatically**, you don't have to pick them one by one, and it works whatever the language of your installation.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-github-card&category=plugin)

| GitHub Card | GitHub Mini Card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card.png" alt="github-card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/mini-card.png" alt="github-mini-card" width="400"> |

## Features

- Two cards: a full **GitHub Card** and a compact **GitHub Mini Card**
- Automatic discovery of the repositories and the account of the GitHub integration through the entity and device registries (any language)
- One foldable section per repository, with its stars, open issues and open pull requests at a glance: one unfolded at a time, folded again on a click elsewhere (a single repository is always unfolded)
- Stars, forks, watchers, open issues, open pull requests, merged pull requests, discussions and downloads of the latest release
- Latest release, tag, commit, pull request, issue and discussion, each with a link to its page on GitHub
- The account: followers, following, public repositories and gists
- Status pill: the open issues and pull requests of the repositories shown, or "Nothing open"
- **Zoom** on the mini card: a button at the top right switches it to the full card and back; a click on a repository opens the full card on it; a click anywhere outside the card brings it back
- Choose the repositories and their order, or sort them by name, stars or open issues and pull requests
- Click any value to open its Home Assistant history (more-info dialog)
- Visual editor in the dashboard UI for every card (no YAML needed)
- Light and dark mode, English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek
- Single file, no external dependency

## Supported integrations

| Integration | What the cards show |
|---|---|
| [GitHub](https://www.home-assistant.io/integrations/github/) (built in) | Stars, forks, watchers, open issues and pull requests, merged pull requests, discussions, release downloads, latest release, tag, commit, pull request, issue and discussion of each repository; followers, following, public repositories and gists of the account |

## Prerequisites

Home Assistant 2024.8 or later, and the [GitHub integration](https://www.home-assistant.io/integrations/github/) added (**Settings → Devices & services → Add integration → GitHub**), with the repositories you want to follow.

The account sensors (followers, following, public repositories and gists) are disabled by default: enable them on the device of your GitHub account to show the **Account** section. Sections and values without a sensor are simply not displayed.

The `repositories` option only chooses among the repositories that the integration follows: each repository must first be added to the integration (**Settings → Devices & services → GitHub → Add repository**). While the integration follows none, the cards say so, with a button that opens the integration's page.

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-github-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-github-card` — Type: **Dashboard**
3. Open **GitHub Card** and click **Install**
4. Clear your browser cache and refresh

### Manual

1. Download `github-card.js` from the [latest release](https://github.com/juju35/ha-github-card/releases/latest)
2. Copy it to `/config/www/github-card.js`
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/github-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Visual editor

Edit a dashboard, click **Add card** and search for **GitHub Card** or **GitHub Mini Card**. Set an optional title, pick the repositories, the sort order, the sections to display and the language. The preview updates live, and options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:github-card
```

```yaml
type: custom:github-mini-card
```

### Full options

```yaml
type: custom:github-card
title: My projects
repositories:
  - home-assistant/core
  - juju35/ha-parcel
sort: stars
show_latest: true
show_account: true
language: fr
```

```yaml
type: custom:github-mini-card
title: My projects
sort: open
max_repos: 5
show_latest: true
show_account: true
zoom: true
language: fr
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `title` | all | `GitHub` | Card title |
| `repositories` | all | All | Repositories to show (`owner/repo`, any case, or the name given to the device), in this order |
| `sort` | all | `name` (the `repositories` order when set) | `name`, `stars` (most starred first) or `open` (most open issues and pull requests first) |
| `show_latest` | all | `true` | Latest release, tag, commit, pull request, issue and discussion of the unfolded repository |
| `show_account` | all | `true` | Account section (full card) and followers (mini card), when the account sensors are enabled |
| `max_repos` | mini | `5` | Repositories listed in the compact view, then "+N" |
| `zoom` | mini | `true` | Zoom button at the top right: shows the full card, and back to the compact view |
| `language` | all | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

## Screenshots

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card.png" alt="card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card-dark.png" alt="card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card-single.png" alt="card with a single repository" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card-single-dark.png" alt="card with a single repository dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card-empty.png" alt="card without any repository followed" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/card-empty-dark.png" alt="card without any repository followed dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/mini-card.png" alt="mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/mini-card-dark.png" alt="mini card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/mini-card-zoom.png" alt="mini card zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-github-card/main/screenshots/mini-card-zoom-dark.png" alt="mini card zoomed in dark" width="400"> |

## How it works

The cards read the entity and device registries of Home Assistant and keep the sensors of the `github` platform. The integration creates one device per repository, named after its full name (`owner/repo`), and one for the account, named after its login; each sensor is recognized by its translation key (`stargazers_count`, `issues_count`, `latest_release`…), so entity ids translated in another language and renamed entities are supported. When the registry gives no translation key, the end of the English entity id is used instead (`sensor.home_assistant_core_stars`).

The counts of the GitHub integration are the **open** issues and pull requests. The latest release, commit, pull request, issue and discussion come with the link of their page on GitHub (the arrow at the end of the row); a click elsewhere on the row opens the sensor's history.

### Mini card

The compact card shows the totals of the repositories shown (stars, forks, open issues, open pull requests), then one line per repository with its stars, open issues and open pull requests, and the overall status at the bottom. At the far right of the header, a small round button (`mdi:arrow-expand`) shows the full card in its place, with the same options, and turns into `mdi:arrow-collapse` to bring the compact view back; a click on a repository shows the full card with that repository unfolded; a click anywhere outside the card brings the compact view back too, but not a click in a dialog opened from it (more-info). `zoom: false` removes the button, and a click on a repository then opens the history of its stars.

## Development

```bash
npm ci               # installs the locked dev dependencies (Playwright, for the screenshots)
npm run build        # bundles src/github-card.js into dist/github-card.js
npm run check        # builds and checks the card (run in CI)
npm test             # unit tests
npm run screenshots  # renders the cards with mock data into screenshots/ (ffmpeg compares the pixels of the captures)
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where the Marketplace installs it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-github-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `github-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Regional variants fall back to the base language (`it-IT` → `it`, `nl-BE` → `nl`); Brazilian Portuguese (`pt-BR`) uses the European Portuguese translation. Counts read "label: {n}" in every language (`Repositories: 3`, `Open: 12`), so that no plural form is ever wrong.

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-github-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
