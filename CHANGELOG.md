# Changelog

## 1.0.0 - 2026-11-09

### Features
- **GitHub Card** (`custom:github-card`): every repository of the GitHub integration as a foldable section (one unfolded at a time, folded again on a click elsewhere; a single repository is always unfolded) with its stars, open issues and pull requests in the header, then its stars, forks, watchers, open issues, open pull requests, merged pull requests, discussions and latest release downloads, and its latest release, tag, commit, pull request, issue and discussion, each with a link to GitHub. The account (followers, following, public repositories and gists) follows when its sensors are enabled.
- **GitHub Mini Card** (`custom:github-mini-card`): total stars, forks, open issues and open pull requests, one line per repository (up to `max_repos`, then "+N"), the overall status and the followers. The zoom button at the top right shows the full card in its place; a click on a repository shows the full card with that repository unfolded; a click outside the card brings the compact view back.
- Automatic discovery through the entity and device registries (platform `github`, translation key), whatever the language; English entity ids as a fallback.
- Status pill: open issues and pull requests of the repositories shown, or "Nothing open".
- Options: `repositories` (and their order), `sort` (`name`, `stars`, `open`), `show_latest`, `show_account`, `zoom`, `max_repos`, `language`; a visual editor for both cards that keeps the YAML minimal.
- English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek.
