"""Which of the offered repositories are archived, for the "Ignore archived repositories" setting.

The GitHub integration's "Add repository" flow only gives names. Whether a repository is archived comes from
the GitHub GraphQL API, with the GitHub integration's access token: one query for 50 repositories at a time,
kept a few minutes.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_ACCESS_TOKEN
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

GRAPHQL_URL = "https://api.github.com/graphql"
CACHE_SECONDS = 600
CHUNK = 50
ARCHIVED_CACHE = "archived"
_NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


def build_query(repos: list[str]) -> str:
    """One GraphQL query asking whether these repositories are archived (owner/name quoted with JSON)."""
    parts = []
    for i, repo in enumerate(repos):
        owner, name = repo.split("/", 1)
        parts.append(
            f"r{i}: repository(owner: {json.dumps(owner)}, name: {json.dumps(name)}) {{ nameWithOwner isArchived }}"
        )
    return "query { " + " ".join(parts) + " }"


def parse(repos: list[str], data: dict[str, Any]) -> set[str]:
    """The archived ones among `repos` (by their position: a renamed repository answers with its new name)."""
    out = set()
    for i, repo in enumerate(repos):
        node = (data or {}).get(f"r{i}")
        if node and node.get("isArchived"):
            out.add(repo.casefold())
    return out


async def async_archived(hass: HomeAssistant, entry: ConfigEntry, repos: list[str]) -> set[str] | None:
    """The archived repositories among `repos` (casefolded names), or None if GitHub could not say.

    Kept `CACHE_SECONDS` for the same list; a failure is not kept.
    """
    names = sorted({r for r in repos if _NAME.match(r)}, key=str.casefold)
    if not names:
        return set()
    cache = hass.data.setdefault(DOMAIN, {})
    key = (entry.entry_id, tuple(names))
    cached = cache.get(ARCHIVED_CACHE)
    if cached and cached[0] == key and time.monotonic() - cached[1] < CACHE_SECONDS:
        return cached[2]
    token = entry.data.get(CONF_ACCESS_TOKEN)
    if not token:
        return None
    session = async_get_clientsession(hass)

    async def _query(chunk: list[str]) -> set[str]:
        async with session.post(
            GRAPHQL_URL,
            json={"query": build_query(chunk)},
            headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"},
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            resp.raise_for_status()
            body = await resp.json()
            return parse(chunk, body.get("data") or {})

    try:
        parts = await asyncio.gather(*(_query(names[s : s + CHUNK]) for s in range(0, len(names), CHUNK)))
    except (aiohttp.ClientError, TimeoutError, ValueError, KeyError, AttributeError) as err:
        _LOGGER.warning("Could not read which repositories are archived: %s", err)
        return None
    archived = set().union(*parts)
    cache[ARCHIVED_CACHE] = (key, time.monotonic(), archived)
    return archived
