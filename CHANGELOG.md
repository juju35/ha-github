# Changelog

## 2.12.0 - 2026-11-17

### Features
- **Illustrated header on both cards.** The GitHub Card and the GitHub Mini Card get a 90 px animated banner: a developer's desk with a laptop showing a commit graph and a mug of coffee, on a 10 px desk strip. The picture and the header icon's colour follow the repositories shown: nothing open (green, commits flowing), open issues and pull requests (amber, with their count by the laptop), a pull request just merged (purple, the branch joins main for ten minutes), unknown (grey) or unavailable (red). The GitHub mark sits as a badge on the icon. Night picture after sunset (`sun.sun`, else the dark theme), forced with `illustration_theme: day | night`; `illustration: false` keeps the classic header. Animations stop with reduced motion. Both options are in the visual editors, in every language.
- README: **animated captures** (GIF, light and dark) of the header: open issues, nothing open, pull request merged and night.

## 2.11.2 - 2026-11-16

### Fixes
- **Your own pull requests no longer appear twice.** The Pull requests tab now leaves out the pull requests you authored on the followed repositories — they already have their own My pull requests tab. They are dropped from the list, from the per-repository open counts and from the sidebar badge, so what is shown and what is counted match.

## 2.11.1 - 2026-11-16

### Fixes
- **My pull requests tab no longer stays empty.** The GraphQL search query closed one brace too many, so GitHub refused it (HTTP 200 with `errors` and no results) and the tab read that as "no pull requests". The brace is fixed; a query GitHub refuses is now surfaced as an error instead of an empty list, and is not cached.

## 2.11.0 - 2026-11-15

### Features
- **Downloads on the Repositories tab.** Each followed repository now shows its latest-release download count on its row, visible without unfolding it, next to the stars, open issues and pull requests. The foot of the tab adds the total downloads across all followed repositories.

## 2.10.0 - 2026-11-15

### Features
- **My pull requests tab.** A new panel tab lists the open pull requests you authored, in any repository — not only the followed ones. It comes from a single GitHub search with the GitHub integration's token (`is:pr is:open author:@me`), cached for a few minutes like the other items, and shows each pull request's repository, number, title, age, comments, labels, review state and the rolled-up state of its checks. The list loads when the tab opens and the Refresh button asks GitHub again.

## 2.9.1 - 2026-11-15

### Maintenance
- Added a README screenshot of the sidebar entry with its count badge (open issues plus pull requests), in both themes.

## 2.9.0 - 2026-11-15

### Features
- **Open issues and pull requests are fetched on a schedule, not when a tab opens.** A background poller queries GitHub on a configurable interval and the panel reads the result from the cache, so opening the Issues or Pull requests tab no longer triggers a GitHub query. The panel and the sidebar badge subscribe to the integration and receive each new batch as it is fetched, and the Refresh button still queries GitHub on demand.
- **Refresh interval setting.** A new "Refresh interval (minutes)" field in the panel's Settings tab sets how often the open issues and pull requests are fetched (1–1440 minutes, default 15).
- **Count badges on the Issues and Pull requests tabs.** Each tab now shows the number of open items of the followed repositories.

## 2.8.1 - 2026-11-15

### Fixed
- **Sidebar badge no longer pushes the panel label out of line.** Home Assistant's recent sidebar places the collapsed badge over the icon with a `ha-svg-icon + .badge` rule, but a custom panel's sidebar icon is an `<ha-icon>`, so the rule did not match and the badge sat in the leading slot and shifted the "GitHub" label to the right when the sidebar was expanded. The badge is now positioned over the icon by the integration itself, so the label stays aligned with the other panels.

## 2.8.0 - 2026-11-15

### Features
- **A count of open issues and pull requests on the sidebar.** The GitHub item in the sidebar now carries a badge with the number of open issues and pull requests of the followed repositories, like the notifications count. Its colour follows the open issues: amber when at least one issue is open, the accent colour when only pull requests are. It mirrors Home Assistant's own badge — a mark over the icon when the sidebar is collapsed, a number at the end of the row when it is expanded. It is read for every administrator every 5 minutes (from the 5-minute cache, no extra GitHub call), even with the panel closed, and goes away when there is nothing open.

## 2.7.2 - 2026-11-14

### Fixes
- README: `embed` (used by the panel) is marked YAML only; the visual editors do not offer it but keep it in the configuration (a test checks it).

## 2.7.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded repository and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: repository folded, mini card compact.
- Clicks lost under an update: Home Assistant updates the card several times a second, and an update that rewrote the card between the press and the release replaced the element pressed, so that the click landed on the card itself and did nothing. The card is no longer rewritten while a press is in progress; the pending update is drawn right after the click.
- Focus ring after a mouse click: the focus was put back on the clicked element after each update, which drew the focus ring. It is now kept across updates only for the keyboard.

## 2.7.0 - 2026-11-13

### Features
- Panel, **Repositories**: a checkbox on each repository not followed yet, and **Follow selected (n)** in the head follows the ticked ones together (one reload of the GitHub integration). The selection stays while searching, so repositories found by different searches can be followed at once.

## 2.6.0 - 2026-11-13

### Features
- Panel, **Settings**: **Ignore archived repositories** leaves the archived repositories out of the ones offered in the Repositories tab (and out of **Follow all**). Whether a repository is archived is read from the GitHub API with the GitHub integration's token, kept 10 minutes; followed repositories are always listed.

## 2.5.0 - 2026-11-12

### Features
- `show_title` and `show_subtitle` options (also in the visual editor) hide the header's title and its subtitle, separately, for a card placed under a section heading of its own (asked in juju35/ha-vehicle-card#72).

## 2.4.4 - 2026-11-10

### Performance
- Panel opens faster: the repositories offered by the GitHub integration (read from the GitHub API by its *Add repository* flow at each opening) are kept 10 minutes, dropped as soon as the followed repositories change, and panels opened together share one read.
- Panel: the repositories, settings and issues load alongside the GitHub Card instead of waiting for it (only the account and the unfolded repository need the card).
- Issues and pull requests: the GitHub queries (20 repositories each) run side by side instead of one after another.

## 2.4.3 - 2026-11-09

### Improvements
- Panel: a failed load shows a **Retry** button next to its error (it is tried again on its own meanwhile), without *No repository matches* under it.

## 2.4.2 - 2026-11-09

### Fixes
- Panel sometimes empty when opened: a load that failed (Home Assistant still starting after a restart or an update, the connection coming back after the app resumed) left the repositories and settings empty until the page was reloaded. It is now tried again after 2 s, 5 s, 15 s, then every 30 s while the panel is shown, and again as soon as the connection is back.

## 2.4.1 - 2026-11-09

### Maintenance
- No code change: released again to check the installation from the Marketplace.

## 2.4.0 - 2026-11-09

### Features
- **Notify new releases** (panel Settings, off by default): a Home Assistant notification for each new release of a followed repository, with its tag, name and link, from the GitHub integration's *Latest release* sensor (another tag than before is a new release; a sensor back from unavailable says nothing new).

## 2.3.1 - 2026-11-09

### Performance
- New issue / pull request notifications: the state listener filters on the watched GitHub sensors in the event bus (`event_filter`), so the state changes of every other entity no longer schedule a call.

### Maintenance
- `__pycache__` files are no longer committed (they were shipped with the integration), and `.gitignore` ignores them.

## 2.3.0 - 2026-11-09

### Changes
- **Panel: the Activity tab is gone**, its content being in the Repositories tab since 2.1.0 (each repository's counters, and the GitHub Card's details once unfolded). What it still added moves to the Repositories tab: the **totals** of the followed repositories in the head (stars, open issues and pull requests, kept live), and the **GitHub account** (followers, following, public repositories and gists) under the list, when its sensors are enabled. The panel has four tabs: Repositories, Issues, Pull requests, Settings; the former `/github-config/activity` address opens Repositories.
- Card: with `embed`, the account section is shown too unless `show_account: false`, and the repositories only when `repositories` lists some.

### Maintenance
- Tests: the head totals, the former Activity address, the card's `embed` account. The Activity tab screenshots are removed.

## 2.2.0 - 2026-11-09

### Features
- **Panel, Repositories tab**: a sort menu next to the search field: **Followed first** (default), **Name**, **Stars**, **Open issues** or **Open pull requests**. The counter orders put the followed repositories first, highest first from their live sensors, then the others by name; the search applies to every order. The choice is remembered in the browser.

### Maintenance
- Tests: every order of the Repositories tab, an unavailable counter, the search with an order.

## 2.1.0 - 2026-11-09

### Features
- **Panel, Repositories tab**: each followed repository shows its stars, open issues, open pull requests and latest release on its row, kept live from the GitHub integration's sensors (without rebuilding the list, so the search field keeps its focus). A click on its name unfolds, under the row, the same details as the GitHub Card: counters (stars, forks, watchers, issues, pull requests, merged pull requests, discussions, downloads) and latest release, tag, commit, pull request, issue and discussion with their links; one repository unfolded at a time, chevron to the right when folded, down when unfolded.
- Card: `embed` option, used by the panel's rows: only the counters and the latest activity of the repositories, without the card's frame, header, foldable sections or account.

### Fixes
- **Issues and Pull requests tabs**: a repository followed under two names (its former name redirects to it after a rename, such as `juju35/ha-github-card` and `juju35/ha-github`) no longer lists its issues and pull requests twice.

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
