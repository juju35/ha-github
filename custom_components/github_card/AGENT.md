# GitHub Card Integration — Agent Context

## Purpose
Home Assistant custom integration (domain `github_card`, repository juju35/ha-github) on top of the core `github`
integration: an admin sidebar panel to follow repositories and read their open issues / pull requests, the bundled
Lovelace cards (`github-card`, `github-mini-card`), and optional notifications of new issues / pull requests.
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
│                    # cached 5 minutes in hass.data[DOMAIN]["items"]
├── archived.py    # Which offered repositories are archived (GraphQL, 50 per query, cached 10 minutes), for the
│                    # ignore_archived setting
├── notify.py        # Persistent notification when a github latest_issue / latest_pull_request number grows
├── translations/    # Config flow strings, 22 languages
├── brand/           # Integration icon
└── frontend/        # github-card.js (cards), github-panel.js (panel, 5 tabs, 22 languages)
```

## Rules
- Versions must agree (Release workflow): manifest.json, const.py VERSION, github-card.js VERSION,
  github-panel.js GITHUB_PANEL_VERSION, package.json.
- Never send the GitHub token to the frontend; the panel only gets lists.
- Adding / removing github subentries one by one reloads the github entry each time: always go through async_apply.
