"""Open issues and pull requests of the followed repositories, for the panel's Issues and Pull requests tabs.

The GitHub integration only exposes counts and the latest issue / pull request of a repository. The full lists
come from the GitHub GraphQL API, with the access token of the GitHub integration (no token of our own): one
query for 20 repositories at a time, kept for a few minutes.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

import aiohttp
from homeassistant.const import CONF_ACCESS_TOKEN
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_call_later, async_track_time_interval

from .const import (
    CONF_REFRESH_MINUTES,
    DEFAULT_REFRESH_MINUTES,
    DOMAIN,
    MAX_REFRESH_MINUTES,
    MIN_REFRESH_MINUTES,
    SIGNAL_ITEMS_UPDATED,
)
from .repositories import followed, github_entry

_LOGGER = logging.getLogger(__name__)

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
    return "query { viewer { login } " + " ".join(parts) + " }"


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
    data: dict[str, Any], seen: set[str] | None = None, viewer: str | None = None
) -> tuple[list[dict], list[dict], dict[str, dict[str, int]]]:
    """Issues and pull requests of a GraphQL answer, and the open totals per repository.

    When ``viewer`` is the token's own login, the pull requests it authored are dropped — from the lists and from
    the open counts — so a followed repository's own pull requests are not shown and counted twice: they already
    have their own "My pull requests" tab.
    """
    seen = set() if seen is None else seen
    issues, pulls, totals = [], [], {}
    viewer_cf = viewer.casefold() if viewer else None
    for alias, repo_data in (data or {}).items():
        if alias == "viewer" or not repo_data:
            continue  # the viewer's login (not a repository), or a repository that no longer exists / is not readable
        repo = repo_data["nameWithOwner"]
        # A repository followed under two names (its former name redirects to the new one) comes back twice:
        # counted once. `seen` carries the repositories already read from the previous queries.
        if repo.casefold() in seen:
            continue
        seen.add(repo.casefold())
        issues += [_item(repo, n, False) for n in repo_data["issues"]["nodes"]]
        repo_pulls = [_item(repo, n, True) for n in repo_data["pullRequests"]["nodes"]]
        pulls_total = repo_data["pullRequests"]["totalCount"]
        if viewer_cf is not None:
            own = sum(1 for p in repo_pulls if (p["author"] or "").casefold() == viewer_cf)
            repo_pulls = [p for p in repo_pulls if (p["author"] or "").casefold() != viewer_cf]
            pulls_total = max(0, pulls_total - own)
        pulls += repo_pulls
        totals[repo] = {"issues": repo_data["issues"]["totalCount"], "pulls": pulls_total}
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
            # Never fetched yet (the first background poll has not landed): the panel keeps showing "loading"
            "pending": self.fetched_at is None and self.error is None,
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
            data = body.get("data") or {}
            viewer = (data.get("viewer") or {}).get("login")
            i, p, t = parse(data, seen, viewer)
            issues += i
            pulls += p
            totals.update(t)
    except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
        return Items(error=type(err).__name__)
    items = Items(sorted(issues, key=_newest, reverse=True), sorted(pulls, key=_newest, reverse=True), totals, now)
    cache["items"] = (repos, items)
    return items


def _followed_repos(hass: HomeAssistant) -> list[str] | None:
    """The followed repositories (valid names), or None when the GitHub integration is not configured."""
    entry = github_entry(hass)
    if entry is None:
        return None
    return sorted((r for r in followed(entry) if _NAME.match(r)), key=str.casefold)


def current_items(hass: HomeAssistant) -> Items:
    """The last fetched issues and pull requests from the cache, without querying GitHub.

    The panel reads this when a tab opens: the background poller is what queries GitHub, on its interval.
    """
    repos = _followed_repos(hass)
    if repos is None:
        return Items(error="github_not_configured")
    cached = hass.data.get(DOMAIN, {}).get("items")
    if cached and cached[0] == repos:
        return cached[1]
    # Nothing cached for the current repositories yet: pending until the next poll.
    return Items()


# ── My pull requests ──────────────────────────────────────────────────────────────────────────────────────────
# The open pull requests authored by the token's user, in any repository (the followed ones and the many others
# one does not follow): a single GitHub search with the GitHub integration's token, cached like the items above.
# This does not depend on the followed repositories, so it has its own cache entry and its own command.

# The issue search returns only pull requests (is:pr); each node carries its repository and, when available, the
# review decision and the rolled-up state of its checks. `author:@me` is the token's own user.
MINE_SEARCH = "is:pr is:open author:@me archived:false"
MINE_QUERY = (
    "query { viewer { login } "
    f"search(query: {json.dumps(MINE_SEARCH)}, type: ISSUE, first: {PER_REPO}) {{ nodes {{ "
    f"... on PullRequest {{ {_FIELDS} isDraft reviewDecision repository {{ nameWithOwner }} "
    "commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } } } } }"
)


def _mine_item(node: dict[str, Any]) -> dict[str, Any]:
    """A pull request node of the search, with its repository, review decision and checks state."""
    repo = (node.get("repository") or {}).get("nameWithOwner") or ""
    item = _item(repo, node, True)
    commits = (node.get("commits") or {}).get("nodes") or []
    rollup = ((commits[0] if commits else {}).get("commit") or {}).get("statusCheckRollup")
    item["checks"] = (rollup or {}).get("state")
    return item


@dataclass
class Mine:
    pulls: list[dict] = field(default_factory=list)
    viewer: str | None = None
    fetched_at: float | None = None
    error: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "pulls": self.pulls,
            "viewer": self.viewer,
            "fetched_at": self.fetched_at,
            "error": self.error,
            # Never fetched yet (the tab has not been opened): the panel keeps showing "loading"
            "pending": self.fetched_at is None and self.error is None,
        }


async def async_mine(hass: HomeAssistant, refresh: bool = False) -> Mine:
    """The open pull requests of the token's user, across every repository, from the cache unless stale or `refresh`."""
    entry = github_entry(hass)
    if entry is None:
        return Mine(error="github_not_configured")
    token = entry.data.get(CONF_ACCESS_TOKEN)
    if not token:
        return Mine(error="no_token")
    cache = hass.data.setdefault(DOMAIN, {})
    cached = cache.get("mine")
    now = time.time()
    if not refresh and cached and now - cached.fetched_at < CACHE_SECONDS:
        return cached
    session = async_get_clientsession(hass)
    try:
        async with session.post(
            GRAPHQL_URL,
            json={"query": MINE_QUERY},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status in (401, 403):
                return Mine(error=f"http_{resp.status}")
            resp.raise_for_status()
            body = await resp.json()
    except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
        return Mine(error=type(err).__name__)
    data = body.get("data") or {}
    # A query GitHub refuses (invalid, or a field the token may not read) comes back as HTTP 200 with `errors` and
    # no search: reported as an error rather than shown as "no pull requests", and not cached.
    errors = body.get("errors") or []
    if errors and not data.get("search"):
        return Mine(error=f"graphql: {(errors[0] or {}).get('message') or 'error'}")
    nodes = (data.get("search") or {}).get("nodes") or []
    pulls = sorted((_mine_item(n) for n in nodes if n), key=_newest, reverse=True)
    viewer = (data.get("viewer") or {}).get("login")
    mine = Mine(pulls, viewer, now)
    cache["mine"] = mine
    return mine


# The first fetch after Home Assistant starts, and a fetch after the followed repositories change, are deferred
# by a few seconds rather than run at once, so startup is not blocked and bursts of follows coalesce.
FIRST_FETCH_DELAY = 8


class ItemsPoller:
    """Fetches the open issues and pull requests in the background, on the configured interval.

    The panel no longer queries GitHub when its Issues or Pull requests tab opens; it reads the cache this poller
    fills (``current_items``) and listens for ``SIGNAL_ITEMS_UPDATED`` to refresh what it shows.
    """

    def __init__(self, hass: HomeAssistant, options: Callable[[], dict[str, Any]]) -> None:
        self._hass = hass
        self._options = options
        self._unsub: Callable[[], None] | None = None  # the recurring interval
        self._soon: Callable[[], None] | None = None  # a one-shot fetch scheduled soon
        self._minutes: int | None = None

    def _interval(self) -> int:
        try:
            minutes = int(self._options().get(CONF_REFRESH_MINUTES, DEFAULT_REFRESH_MINUTES))
        except (TypeError, ValueError):
            minutes = DEFAULT_REFRESH_MINUTES
        return max(MIN_REFRESH_MINUTES, min(MAX_REFRESH_MINUTES, minutes))

    @callback
    def async_start(self) -> Callable[[], None]:
        """Schedule the recurring fetch and a first one shortly after startup; returns a callback that stops them."""
        self._schedule()
        self.async_refresh_soon()

        @callback
        def _stop() -> None:
            if self._unsub:
                self._unsub()
                self._unsub = None
            if self._soon:
                self._soon()
                self._soon = None

        return _stop

    @callback
    def async_reschedule(self) -> None:
        """Re-arm the timer when the interval setting changed (called after the settings are saved)."""
        if self._interval() != self._minutes:
            self._schedule()

    @callback
    def async_refresh_soon(self) -> None:
        """Fetch a few seconds from now (startup, or the followed repositories changed); coalesces repeats."""
        if self._soon:
            self._soon()
        self._soon = async_call_later(self._hass, FIRST_FETCH_DELAY, self._poll)

    @callback
    def _schedule(self) -> None:
        if self._unsub:
            self._unsub()
        self._minutes = self._interval()
        self._unsub = async_track_time_interval(self._hass, self._poll, timedelta(minutes=self._minutes))

    async def _poll(self, _now: Any = None) -> None:
        self._soon = None
        try:
            await async_items(self._hass, refresh=True)
        except Exception:  # noqa: BLE001 - a scheduled fetch must never break the integration
            _LOGGER.exception("GitHub Card: could not refresh the open issues and pull requests")
            return
        async_dispatcher_send(self._hass, SIGNAL_ITEMS_UPDATED)
