# Changelog

## 2.1.0 - 2026-11-09

### Features
- **Panel, Repositories tab**: each followed repository shows its stars, open issues, open pull requests and latest release on its row, kept live from the GitHub integration's sensors (without rebuilding the list, so the search field keeps its focus). A click on its name unfolds, under the row, the same details as the GitHub Card: counters (stars, forks, watchers, issues, pull requests, merged pull requests, discussions, downloads) and latest release, tag, commit, pull request, issue and discussion with their links; one repository unfolded at a time, chevron to the right when folded, down when unfolded.
- Card: `embed` option, used by the panel's rows: only the counters and the latest activity of the repositories, without the card's frame, header, foldable sections or account.

### Maintenance
- `github_card/repositories` gives the entity ids of each followed repository's row sensors.
- Tests: the row counters, the unfolding, the card's `embed` mode, the row sensors of the command. Screenshot of the Repositories tab with a repository unfolded.

## 2.0.0 - 2026-11-09

### Breaking changes
- **The repository is now an integration** (renamed `ha-github`, Marketplace type **Integration**), which ships the cards: remove the former **GitHub Card** dashboard plugin from the Marketplace, add the repository again as an integration, restart, and add the **GitHub Card** integration. The cards are then loaded on every dashboard by the integration, and the former card resource is replaced by `/github_card/github-card.js`. Card configurations are unchanged. Requires Home Assistant 2026.11 (GitHub integration with repository entries).

### Features
- **GitHub sidebar panel** (administrators only), five tabs as in the other ha-* panels (text tabs, the tab in the address, Settings last):
  - **Repositories**: the repositories of your account (and your starred ones, if chosen), followed or not by the GitHub integration; **Follow**, **Stop following** (confirmed first) or **Follow all**, through the GitHub integration's own repository entries, with a single reload of the GitHub integration for the whole change; search field;
  - **Issues** and **Pull requests**: the open ones of the followed repositories, most recently updated first (repository, number, author, age, comments, labels, review state and draft), filter by repository, **Refresh**; read from the GitHub GraphQL API with the GitHub integration's access token, cached for 5 minutes;
  - **Activity**: the GitHub Card with every followed repository, busiest first;
  - **Settings**: repositories offered (name patterns, starred repositories) and notifications.
- **Notifications** (off by default): a Home Assistant notification for each new issue or pull request of a followed repository, with its link.
- Integration icon in the style of the other ha-* integrations.
- Panel and notifications translated in the 22 languages of the cards.

### Maintenance
- CI of an integration: hassfest, pytest, ruff, vulture, HACS validation as an integration, release archive `github_card.zip`; card and panel tests with Node.
- Screenshots of the five panel tabs, light and dark.

## 1.0.1 - 2026-11-09

### Fixes
- **No repository followed**: when the GitHub integration follows no repository (only the account), or none of those of the `repositories` option, both cards say so instead of "Repositories: 0" and an "Unknown" status, and offer a button that opens the GitHub integration page, where repositories are added; the account is still shown below. Translated in every language.

### Maintenance
- Screenshots: the full card without any repository, light and dark.
- Tests: the empty state of both cards, repositories not followed, the integration button.

## 1.0.0 - 2026-11-09

### Features
- **GitHub Card** (`custom:github-card`): every repository of the GitHub integration as a foldable section (one unfolded at a time, folded again on a click elsewhere; a single repository is always unfolded) with its stars, open issues and pull requests in the header, then its stars, forks, watchers, open issues, open pull requests, merged pull requests, discussions and latest release downloads, and its latest release, tag, commit, pull request, issue and discussion, each with a link to GitHub. The account (followers, following, public repositories and gists) follows when its sensors are enabled.
- **GitHub Mini Card** (`custom:github-mini-card`): total stars, forks, open issues and open pull requests, one line per repository (up to `max_repos`, then "+N"), the overall status and the followers. The zoom button at the top right shows the full card in its place; a click on a repository shows the full card with that repository unfolded; a click outside the card brings the compact view back.
- Automatic discovery through the entity and device registries (platform `github`, translation key), whatever the language; English entity ids as a fallback.
- Status pill: open issues and pull requests of the repositories shown, or "Nothing open".
- Options: `repositories` (and their order), `sort` (`name`, `stars`, `open`), `show_latest`, `show_account`, `zoom`, `max_repos`, `language`; a visual editor for both cards that keeps the YAML minimal.
- English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek.
