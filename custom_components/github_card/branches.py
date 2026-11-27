"""Branches of the token user's own repositories, for the panel's Branches tab: list them, delete the chosen ones.

The list comes from one paginated GitHub GraphQL query with the access token of the GitHub integration (the
token user's own repositories, archived ones left out, 50 per page): every branch but the default one, with the
date of its last commit and its open pull request, if any. The panel keeps the ones older than the age set in
Settings. Kept a few minutes; ``refresh`` asks GitHub again.

A branch is deleted with the GitHub CLI signed in on the host (``gh api --method DELETE
repos/{repo}/git/refs/heads/{branch}``): the GitHub integration's token may not delete branches. The default branch
of a repository is never deleted.
"""

from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import quote

import aiohttp
from homeassistant.const import CONF_ACCESS_TOKEN
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from . import gh_cli
from .const import DOMAIN
from .repositories import github_entry

_LOGGER = logging.getLogger(__name__)

GRAPHQL_URL = "https://api.github.com/graphql"
CACHE_SECONDS = 300
CACHE = "branches"
MAX_PAGES = 40  # 2,000 repositories
MAX_DELETE = 200
DELETE_PARALLEL = 4
REPO_RE = re.compile(r"^[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$")
# A branch name git accepts (no '..', no control characters, spaces, '~^:?*[\', no leading '-' or '/', no '.lock')
BRANCH_RE = re.compile(
    r"^(?!-)(?!/)(?!.*\.\.)(?!.*//)(?!.*@\{)(?!.*\.lock$)(?!.*/$)(?!.*\.$)[^\x00-\x20~^:?*\[\\\x7f]{1,250}$"
)

QUERY = """
query($endCursor: String) {
  viewer {
    login
    repositories(first: 50, after: $endCursor, ownerAffiliations: OWNER, isArchived: false) {
      pageInfo { hasNextPage endCursor }
      nodes {
        nameWithOwner
        defaultBranchRef { name }
        refs(refPrefix: "refs/heads/", first: 100) {
          totalCount
          nodes {
            name
            target { ... on Commit { committedDate } }
            associatedPullRequests(states: OPEN, first: 1) { nodes { number url } }
          }
        }
      }
    }
  }
}
"""


@dataclass
class Branches:
    branches: list[dict[str, Any]] = field(default_factory=list)
    login: str | None = None
    repositories: int = 0
    fetched_at: float | None = None
    error: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "branches": self.branches,
            "login": self.login,
            "repositories": self.repositories,
            "fetched_at": self.fetched_at,
            "error": self.error,
        }


def parse(pages: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int, str | None]:
    """The branches (default ones left out), oldest first; the number of repositories; the viewer's login."""
    branches: list[dict[str, Any]] = []
    repos = 0
    login = None
    for page in pages:
        viewer = page.get("viewer") or {}
        login = login or viewer.get("login")
        for repo in (viewer.get("repositories") or {}).get("nodes") or []:
            if not repo:
                continue
            repos += 1
            default = (repo.get("defaultBranchRef") or {}).get("name")
            for ref in (repo.get("refs") or {}).get("nodes") or []:
                if not ref or ref.get("name") == default:
                    continue
                pr = ((ref.get("associatedPullRequests") or {}).get("nodes") or [None])[0]
                branches.append(
                    {
                        "repo": repo["nameWithOwner"],
                        "branch": ref["name"],
                        "date": (ref.get("target") or {}).get("committedDate"),
                        "default": default,
                        "pr": {"number": pr["number"], "url": pr["url"]} if pr else None,
                    }
                )
    branches.sort(key=lambda b: (b["date"] or "", b["repo"].casefold(), b["branch"]))
    return branches, repos, login


def _token(hass: HomeAssistant) -> tuple[str | None, str | None]:
    entry = github_entry(hass)
    if entry is None:
        return None, "github_not_configured"
    token = entry.data.get(CONF_ACCESS_TOKEN)
    return (token, None) if token else (None, "no_token")


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


async def async_branches(hass: HomeAssistant, refresh: bool = False) -> Branches:
    """The branches of the token user's repositories, from the cache unless stale or ``refresh``."""
    token, error = _token(hass)
    if error:
        return Branches(error=error)
    cache = hass.data.setdefault(DOMAIN, {})
    cached: Branches | None = cache.get(CACHE)
    now = time.time()
    if not refresh and cached and cached.fetched_at and now - cached.fetched_at < CACHE_SECONDS:
        return cached
    session = async_get_clientsession(hass)
    pages: list[dict[str, Any]] = []
    cursor = None
    try:
        for _ in range(MAX_PAGES):
            async with session.post(
                GRAPHQL_URL,
                json={"query": QUERY, "variables": {"endCursor": cursor}},
                headers=_headers(token),
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                if resp.status in (401, 403):
                    return Branches(error=f"http_{resp.status}")
                resp.raise_for_status()
                body = await resp.json()
            data = body.get("data") or {}
            if body.get("errors") and not data.get("viewer"):
                return Branches(error=f"graphql: {(body['errors'][0] or {}).get('message') or 'error'}")
            pages.append(data)
            info = ((data.get("viewer") or {}).get("repositories") or {}).get("pageInfo") or {}
            if not info.get("hasNextPage"):
                break
            cursor = info.get("endCursor")
    except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
        return Branches(error=type(err).__name__)
    branches, repos, login = parse(pages)
    result = Branches(branches, login, repos, now)
    cache[CACHE] = result
    return result


async def _delete_one(repo: str, branch: str) -> str | None:
    """Delete one branch with gh: None, or gh's error (a branch already gone counts as deleted)."""
    error = await gh_cli.async_api("--method", "DELETE", f"repos/{repo}/git/refs/heads/{quote(branch, safe='/')}")
    if error and "reference does not exist" in error.lower():
        return None
    return error


async def async_delete(hass: HomeAssistant, targets: list[dict[str, str]]) -> dict[str, Any]:
    """Delete these branches (``{"repo", "branch"}``) with gh; the default branch of a repository is refused."""
    status = await gh_cli.async_status(hass)
    if not status["installed"]:
        return {"ok": False, "error": "gh_missing"}
    if not status["authenticated"]:
        return {"ok": False, "error": "gh_not_authenticated"}
    cached: Branches | None = hass.data.get(DOMAIN, {}).get(CACHE)
    # Only a branch of the last list is deleted: never a default branch, nor one the panel did not show
    listed = {(b["repo"], b["branch"]) for b in (cached.branches if cached else []) if b["branch"] != b["default"]}
    defaults = {b["default"] for b in (cached.branches if cached else []) if b["default"]}
    semaphore = asyncio.Semaphore(DELETE_PARALLEL)

    async def _one(target: dict[str, str]) -> dict[str, Any]:
        repo, branch = target["repo"], target["branch"]
        if not REPO_RE.match(repo) or not BRANCH_RE.match(branch):
            return {"repo": repo, "branch": branch, "ok": False, "error": "invalid"}
        if (repo, branch) not in listed:
            error = "default_branch" if branch in defaults or branch in ("main", "master") else "not_listed"
            return {"repo": repo, "branch": branch, "ok": False, "error": error}
        async with semaphore:
            err = await _delete_one(repo, branch)
        if err:
            _LOGGER.warning("Could not delete the branch %s of %s: %s", branch, repo, err)
        return {"repo": repo, "branch": branch, "ok": err is None, **({"error": err} if err else {})}

    results = await asyncio.gather(*(_one(t) for t in targets))
    deleted = {(r["repo"], r["branch"]) for r in results if r["ok"]}
    if cached and deleted:
        cached.branches = [b for b in cached.branches if (b["repo"], b["branch"]) not in deleted]
    return {"ok": True, "results": list(results)}
