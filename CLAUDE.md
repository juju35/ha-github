# Repository guide for agents

## Commits
- Write every commit message in **English**, following **Conventional Commits**:
  `type(scope): subject` — types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`,
  `perf`, `test`, `build`, `ci`, `revert`. Subject in imperative mood, lower case,
  no trailing period, ≤ 72 chars.
- Author identity must be **juju35** (`juju35 <julienstephan29@gmail.com>`), never an assistant identity.
- Keep history clean and linear: small, focused commits, one logical change each.
- `main` is protected: land changes through a PR (squash-merge, title + description).

## Before opening a PR — run the checks locally
CI mirrors these; running them first avoids round-trips:
```sh
pre-commit run -a                                                   # ruff, biome, formatting hooks
vulture custom_components .vulture_whitelist.py --min-confidence 60 # dead code (whitelist = existing only)
npx --yes jscpd@5.4.2 .                                             # duplication
pytest                                                             # integration tests
npm run check                                                      # node --check on the card and panel JS
node --test test/*.test.mjs                                        # card tests
```

## Releasing — how it works here
A release is **automatic**: on push to `main`, if `manifest.json` carries a version with
no matching tag, the Release workflow publishes `vX.Y.Z`. **Never create a tag by hand.**

The `Version consistency` check (validate.yml) requires the **same version in every place**,
or the release fails. Note: the **panel JS version is checked by the Release job too** — a PR
can go green while the release fails silently if the panel constant is out of sync.

## Bumping the version — this is a panel INTEGRATION (with a card)
A bump is complete only when **all seven** carry the new version, updated together in one commit:
1. `CHANGELOG.md` → add a `## X.Y.Z - YYYY-MM-DD` section at the top
   (`### Features` | `Fixes` | `Performance` | `Maintenance`).
2. `custom_components/github_card/manifest.json` → `"version": "X.Y.Z"`.
3. `custom_components/github_card/const.py` → `VERSION = "X.Y.Z"`.
4. `custom_components/github_card/frontend/github-card.js` → `const VERSION = "X.Y.Z"`.
5. `custom_components/github_card/frontend/github-panel.js` → `GITHUB_PANEL_VERSION = "X.Y.Z"`.
6. `package.json` → `"version": "X.Y.Z"`.
7. `package-lock.json` → run `npm install` so its `version` matches.
- Bump rule: `fix` → patch, `feat` → minor, breaking change → major.
- The PR/commit title carries the version in parentheses, e.g. `feat: issues filter (2.9.0)`.

## README layout
- Header order: H1, then the badge row, then the integration's **own logo** centered under
  the badges — `<p align="center"><img src=".../custom_components/github_card/brand/icon.png" width="120"></p>`.
- **Brand logos**: when the repo targets external brands/services, a centered
  `<p align="center">` row of their logos goes right after the own logo.
- Keep image `width`/`height` bounded so the README renders cleanly (HACS/Marketplace).

## Supported integrations
This builds on top of the core Home Assistant **GitHub** integration, so keep a
`## Supported integrations` section (title verbatim) listing the HA integration(s) it works
on top of, with a link to each.

## Translations
- English is the source. Keep every language in
  `custom_components/github_card/translations/*.json` in sync when a user-facing string changes.

## Screenshots — do not edit or commit them by hand
The Screenshots workflow regenerates them on the PR branch and commits them with `[skip ci]`.
Comparison is exact. They are English, with light/dark twins, neutral/mock data, and never
real family names.

## Conventions
- Prefer YAML over UI configuration; keep configurations minimal; test iteratively.
- English-only README and screenshots; mock/neutral data in published screenshots.
- `custom:github-card` is the full card, `custom:github-mini-card` the compact one.
- Call it the **Marketplace** (Home Assistant 2026.11), not HACS, in docs, issue comments
  and user replies.
- Reply to GitHub issues in the **language of the issue / reporter**, not French by default.
