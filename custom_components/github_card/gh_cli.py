"""The GitHub CLI (``gh``) on the Home Assistant host: its status, and creating a repository with it.

The panel's Create tab only shows when ``gh`` is on the PATH of Home Assistant and ``gh auth status`` succeeds
(the CLI signed in on github.com). The repository is created with ``gh repo create`` (name, visibility,
description, homepage), then its topics are set with ``gh repo edit --add-topic``. Every argument goes to the
process as is (no shell); the values are checked first, so none can be read as an option.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import shutil
import time
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

GH = "gh"
# The status is asked again after this long (a sign-in made meanwhile shows up), or when the panel refreshes it
STATUS_CACHE_SECONDS = 60
STATUS_CACHE = "gh_status"
TIMEOUT_SECONDS = 60

# GitHub's rules: a name of letters, digits, '-', '_' and '.', not starting with '-' or '.', at most 100 characters;
# an owner (user or organization) of letters, digits and inner '-'; a topic of lower case letters, digits and inner
# '-', at most 50 characters, at most 20 topics.
NAME_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9._-]{0,99}$")
OWNER_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")
TOPIC_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,49}$")
MAX_TOPICS = 20
MAX_DESCRIPTION = 350
MAX_HOMEPAGE = 255
HOMEPAGE_RE = re.compile(r"^https?://[^\s/$.?#][^\s]*$", re.IGNORECASE)
VISIBILITIES = ("public", "private")
_LOGIN_RE = re.compile(r"(?:account|as)\s+([A-Za-z0-9-]+)")
_URL_RE = re.compile(r"https://github\.com/([^/\s]+/[^/\s]+)")


def _env() -> dict[str, str]:
    """No prompt, colour or update notice: gh runs unattended."""
    return {
        **os.environ,
        "GH_PROMPT_DISABLED": "1",
        "GH_NO_UPDATE_NOTIFIER": "1",
        "NO_COLOR": "1",
        "CLICOLOR": "0",
    }


async def _run(*args: str) -> tuple[int, str, str]:
    """Run gh with these arguments: exit code, stdout, stderr (127 when it cannot be started)."""
    try:
        proc = await asyncio.create_subprocess_exec(
            GH,
            *args,
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=_env(),
        )
    except OSError as exc:
        return 127, "", str(exc)
    try:
        out, err = await asyncio.wait_for(proc.communicate(), TIMEOUT_SECONDS)
    except TimeoutError:
        proc.kill()
        await proc.wait()
        return 124, "", "timeout"
    return proc.returncode or 0, out.decode(errors="replace").strip(), err.decode(errors="replace").strip()


def _error(out: str, err: str) -> str:
    """The message gh gave, on one short line."""
    text = (err or out or "gh failed").strip().splitlines()
    return " ".join(line.strip() for line in text if line.strip())[:300] or "gh failed"


async def async_status(hass: HomeAssistant, refresh: bool = False) -> dict[str, Any]:
    """Whether gh is installed and signed in on github.com, with the account's login. Cached a minute."""
    data = hass.data.setdefault(DOMAIN, {})
    cached = data.get(STATUS_CACHE)
    if cached and not refresh and time.monotonic() - cached[0] < STATUS_CACHE_SECONDS:
        return cached[1]
    status: dict[str, Any] = {"installed": False, "authenticated": False, "login": None, "error": None}
    if await hass.async_add_executor_job(shutil.which, GH) is not None:
        status["installed"] = True
        code, out, err = await _run("auth", "status", "--hostname", "github.com")
        if code == 0:
            status["authenticated"] = True
            # Older gh versions write the status on stderr, newer ones on stdout
            if match := _LOGIN_RE.search(f"{out}\n{err}"):
                status["login"] = match.group(1)
        else:
            status["error"] = _error(out, err)
    data[STATUS_CACHE] = (time.monotonic(), status)
    return status


def clean_topics(topics: list[str]) -> list[str]:
    """Topics lower case, without blanks or duplicates, in their order."""
    seen: list[str] = []
    for topic in topics:
        value = topic.strip().lower().replace(" ", "-")
        if value and value not in seen:
            seen.append(value)
    return seen


def validate(name: str, owner: str, description: str, topics: list[str], homepage: str = "") -> str | None:
    """The first invalid value's error key, or None."""
    if not NAME_RE.match(name) or name in (".", ".."):
        return "invalid_name"
    if owner and not OWNER_RE.match(owner):
        return "invalid_owner"
    if len(description) > MAX_DESCRIPTION or any(c in description for c in "\r\n"):
        return "invalid_description"
    if homepage and (len(homepage) > MAX_HOMEPAGE or not HOMEPAGE_RE.match(homepage)):
        return "invalid_homepage"
    if len(topics) > MAX_TOPICS or not all(TOPIC_RE.match(t) for t in topics):
        return "invalid_topics"
    return None


async def async_create(
    hass: HomeAssistant,
    *,
    name: str,
    owner: str = "",
    description: str = "",
    homepage: str = "",
    topics: list[str] | None = None,
    visibility: str = "public",
) -> dict[str, Any]:
    """Create the repository with gh, then set its topics. ``{"ok": True, "full_name", "url"}`` or an error."""
    status = await async_status(hass, refresh=True)
    if not status["installed"]:
        return {"ok": False, "error": "gh_missing"}
    if not status["authenticated"]:
        return {"ok": False, "error": "gh_not_authenticated"}
    name, owner, description, homepage = name.strip(), owner.strip(), description.strip(), homepage.strip()
    topics = clean_topics(topics or [])
    if (invalid := validate(name, owner, description, topics, homepage)) is not None:
        return {"ok": False, "error": invalid}
    if visibility not in VISIBILITIES:
        return {"ok": False, "error": "invalid_visibility"}
    target = f"{owner}/{name}" if owner else name
    args = ["repo", "create", target, f"--{visibility}"]
    if description:
        # With '=', a description starting with '-' stays the option's value
        args.append(f"--description={description}")
    if homepage:
        args.append(f"--homepage={homepage}")
    code, out, err = await _run(*args)
    if code != 0:
        _LOGGER.warning("gh repo create %s failed: %s", target, _error(out, err))
        return {"ok": False, "error": "gh_failed", "message": _error(out, err)}
    match = _URL_RE.search(out)
    full_name = match.group(1) if match else (target if owner else f"{status['login']}/{name}")
    url = f"https://github.com/{full_name}"
    result: dict[str, Any] = {"ok": True, "full_name": full_name, "url": url, "topics": topics}
    if topics:
        edit = ["repo", "edit", full_name]
        for topic in topics:
            edit += ["--add-topic", topic]
        code, out, err = await _run(*edit)
        if code != 0:
            # Created all the same: the panel says the topics could not be set
            _LOGGER.warning("gh repo edit %s --add-topic failed: %s", full_name, _error(out, err))
            result["topics_error"] = _error(out, err)
    return result
