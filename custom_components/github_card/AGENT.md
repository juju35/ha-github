# GitHub Card Integration — Agent Context

## Purpose
Home Assistant custom integration (domain `github_card`, repository juju35/ha-github) on top of the core `github`
integration: an admin sidebar panel to follow repositories and read their open issues / pull requests (and the viewer's own
open pull requests across every repository), the bundled Lovelace cards (`github-card`, `github-mini-card`), and
optional notifications of new issues / pull requests.
It has no token of its own and creates no entity.

## Architecture
```
custom_components/github_card/
├── __init__.py      # Static paths (card, panel), panel on setup_entry, card dashboard resource, notifier
├── config_flow.py   # Single entry (manifest single_config_entry), no question; settings live in the panel
├── const.py         # DOMAIN, VERSION, URLs, settings keys and defaults
├── panel.py         # panel_custom registration (require_admin, /github-config) and github_card/* WebSocket commands
├── repositories.py  # Followed repositories (github subentries "repository"), offered ones (read from the github
│                    # integration's own subentry flow, then aborted), async_apply: one unload / setup of the github
│                    # entry for a whole follow / unfollow change
├── items.py         # Open issues / PRs via GitHub GraphQL with the github entry's access_token, 20 repos per query,
│                    # cached 5 minutes in hass.data[DOMAIN]["items"]; also async_mine: the viewer's own open PRs in
│                    # any repository (a GitHub search, author:@me), cached in hass.data[DOMAIN]["mine"]
├── archived.py    # Which offered repositories are archived (GraphQL, 50 per query, cached 10 minutes), for the
│                    # ignore_archived setting
├── branches.py      # Branches tab: one paginated GraphQL query (viewer's own repos, not archived) with the github
│                    # entry's token, default branches left out, cached 5 min; deleted with gh api DELETE git/refs/heads/…
│                    # only (the integration's token may not), default branch refused
├── gh_cli.py        # The GitHub CLI on the HA host: gh auth status (cached 1 min); gh repo create, then the protections in
│                    # steps (empty commit on main via git + gh auth git-credential, merge settings via gh api PATCH,
│                    # topics, rulesets built-in or copied from a template) — no shell, values checked first; defaults
│                    # are the repo_* settings (const.REPO_DEFAULTS), overridden per repository by the panel
├── services.py      # Action github_card.create_repository (admin only, async_register_admin_service): gh_cli.async_create
│                    # with the repo_* settings as defaults (website template, topics, visibility, protections);
│                    # returns full_name / url / topics / steps, raises HomeAssistantError when the creation fails
├── notify.py        # Persistent notification when a github latest_issue / latest_pull_request number grows
├── translations/    # Config flow, action and error strings, 22 languages
├── brand/           # Integration icon
└── frontend/        # github-card.js (cards), github-panel.js (panel, 7 tabs — Create only when gh is signed in, 22 languages)
```

## Rules
- Versions must agree (Release workflow): manifest.json, const.py VERSION, github-card.js VERSION,
  github-panel.js GITHUB_PANEL_VERSION, package.json.
- Never send the GitHub token to the frontend; the panel only gets lists.
- Adding / removing github subentries one by one reloads the github entry each time: always go through async_apply.
- Panel top bar (2.15.0): the desk banner across the page (`.topbar`, `_renderHead`: title, followed pill, login + fetched line, Refresh / GitHub / integration buttons; its ha-menu-button kept), tabs under it on the page background; `bare` hides `.topbar`. Tab cards keep a compact header (`_banner` → `.thead`, no scene). Repositories: To handle card (`_handleHtml`, redrawn alone by `_renderHandle` when items change). Issues / Pull requests filter: chips only for repositories with open items, top 5, the rest in `<details class="more">` with a search (repos at 0 `hidden data-quiet`, shown only when searched).
