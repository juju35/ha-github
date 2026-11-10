"""Open issues and pull requests of the followed repositories, for the panel's Issues and Pull requests tabs.

The GitHub integration only exposes counts and the latest issue / pull request of a repository. The full lists
come from the GitHub GraphQL API, with the access token of the GitHub integration (no token of our own): one
query for 20 repositories at a time, kept for a few minutes.
"""

from __future__ import annotations

import asyncio
import json
import re
import time
from dataclasses import dataclass, field
from typing import Any

import aiohttp
from homeassistant.const import CONF_ACCESS_TOKEN
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN
from .repositories import followed, github_entry

GRAPHQL_URL = "https://api.github.com/graphql"
CACHE_SECONDS = 300
CHUNK = 20
PER_REPO = 50
_NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")

_FIELDS = (
    "number title url createdAt updatedAt author { login } comments { totalCount } "
    "labels(first: 6) { nodes { name color } }"
)
_ORDER = f"states: OPEN, first: {PER_REPO}, orderBy: {{field: UPDATED_AT, direction: DESC}}"


def build_query(repos: list[str]) -> str:
    """One GraphQL query for these repositories (validated owner/name, quoted with JSON)."""
    parts = []
    for i, repo in enumerate(repos):
        owner, name = repo.split("/", 1)
        parts.append(
            f"r{i}: repository(owner: {json.dumps(owner)}, name: {json.dumps(name)}) {{ nameWithOwner "
            f"issues({_ORDER}) {{ totalCount nodes {{ {_FIELDS} }} }} "
            f"pullRequests({_ORDER}) {{ totalCount nodes {{ {_FIELDS} isDraft reviewDecision }} }} }}"
        )
    return "query { " + " ".join(parts) + " }"


def _item(repo: str, node: dict[str, Any], pull: bool) -> dict[str, Any]:
    item = {
        "repo": repo,
        "number": node.get("number"),
        "title": node.get("title") or "",
        "url": node.get("url") or "",
        "author": (node.get("author") or {}).get("login") or "",
        "created": node.get("createdAt"),
        "updated": node.get("updatedAt"),
        "comments": (node.get("comments") or {}).get("totalCount") or 0,
        "labels": [
            {"name": lb.get("name", ""), "color": lb.get("color", "")}
            for lb in (node.get("labels") or {}).get("nodes") or []
        ],
    }
    if pull:
        item["draft"] = bool(node.get("isDraft"))
        item["review"] = node.get("reviewDecision")
    return item


def _newest(item: dict[str, Any]) -> str:
    return item["updated"] or ""


def parse(
    data: dict[str, Any], seen: set[str] | None = None
) -> tuple[list[dict], list[dict], dict[str, dict[str, int]]]:
    """Issues and pull requests of a GraphQL answer, and the open totals per repository."""
    seen = set() if seen is None else seen
    issues, pulls, totals = [], [], {}
    for repo_data in (data or {}).values():
        if not repo_data:
            continue  # a repository that no longer exists or is not readable: its alias is null
        repo = repo_data["nameWithOwner"]
        # A repository followed under two names (its former name redirects to the new one) comes back twice:
        # counted once. `seen` carries the repositories already read from the previous queries.
        if repo.casefold() in seen:
            continue
        seen.add(repo.casefold())
        issues += [_item(repo, n, False) for n in repo_data["issues"]["nodes"]]
        pulls += [_item(repo, n, True) for n in repo_data["pullRequests"]["nodes"]]
        totals[repo] = {"issues": repo_data["issues"]["totalCount"], "pulls": repo_data["pullRequests"]["totalCount"]}
    return sorted(issues, key=_newest, reverse=True), sorted(pulls, key=_newest, reverse=True), totals


@dataclass
class Items:
    issues: list[dict] = field(default_factory=list)
    pulls: list[dict] = field(default_factory=list)
    totals: dict[str, dict[str, int]] = field(default_factory=dict)
    fetched_at: float | None = None
    error: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "issues": self.issues,
            "pulls": self.pulls,
            "totals": self.totals,
            "fetched_at": self.fetched_at,
            "error": self.error,
        }


async def async_items(hass: HomeAssistant, refresh: bool = False) -> Items:
    """Open issues and pull requests of the followed repositories, from the cache unless stale or `refresh`."""
    entry = github_entry(hass)
    if entry is None:
        return Items(error="github_not_configured")
    repos = sorted((r for r in followed(entry) if _NAME.match(r)), key=str.casefold)
    if not repos:
        return Items()
    cache = hass.data.setdefault(DOMAIN, {})
    cached = cache.get("items")
    now = time.time()
    if not refresh and cached and cached[0] == repos and now - cached[1].fetched_at < CACHE_SECONDS:
        return cached[1]
    token = entry.data.get(CONF_ACCESS_TOKEN)
    if not token:
        return Items(error="no_token")
    session = async_get_clientsession(hass)
    issues, pulls, totals = [], [], {}
    seen: set[str] = set()

    async def _query(names: list[str]) -> dict[str, Any] | str:
        async with session.post(
            GRAPHQL_URL,
            json={"query": build_query(names)},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status in (401, 403):
                return f"http_{resp.status}"
            resp.raise_for_status()
            return await resp.json()

    # The queries of 20 repositories each run side by side (they waited for one another), parsed in order
    try:
        bodies = await asyncio.gather(*(_query(repos[s : s + CHUNK]) for s in range(0, len(repos), CHUNK)))
        for body in bodies:
            if isinstance(body, str):
                return Items(error=body)
            i, p, t = parse(body.get("data") or {}, seen)
            issues += i
            pulls += p
            totals.update(t)
    except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
        return Items(error=type(err).__name__)
    items = Items(sorted(issues, key=_newest, reverse=True), sorted(pulls, key=_newest, reverse=True), totals, now)
    cache["items"] = (repos, items)
    return items
