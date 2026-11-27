"""The GitHub CLI (``gh``) on the Home Assistant host: its status, and creating a repository with it.

After the creation, the protections chosen (defaults in Settings, overridable per repository) are applied in steps:
an empty first commit on ``main`` (git, signed in through ``gh auth git-credential``), the merge settings, the topics,
then the rulesets — the built-in ones (default branch, ``v*`` tags) or those copied from a template repository.
A step that fails is reported; the repository stays created.

The panel's Create tab only shows when ``gh`` is on the PATH of Home Assistant and ``gh auth status`` succeeds
(the CLI signed in on github.com). The repository is created with ``gh repo create`` (name, visibility,
description, homepage), then its topics are set with ``gh repo edit --add-topic``. Every argument goes to the
process as is (no shell); the values are checked first, so none can be read as an option.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import shutil
import tempfile
import time
from typing import Any

from homeassistant.core import HomeAssistant

from .const import (
    CONF_REPO_AUTO_MERGE,
    CONF_REPO_DELETE_BRANCH,
    CONF_REPO_EMPTY_COMMIT,
    CONF_REPO_NO_WIKI,
    CONF_REPO_PROTECT_BRANCH,
    CONF_REPO_PROTECT_TAGS,
    CONF_REPO_RULESETS_FROM,
    CONF_REPO_SQUASH_ONLY,
    CONF_REPO_SQUASH_PR,
    DOMAIN,
    REPO_DEFAULTS,
    REPO_PROTECTIONS,
)

_LOGGER = logging.getLogger(__name__)

GH = "gh"
# On Home Assistant OS, Home Assistant runs in its own container, where nothing installed by hand survives an
# update: gh is also looked for in the configuration folder, shared with the Terminal & SSH add-on, with its sign-in
# kept there too (GH_CONFIG_DIR) — /config/.gh/bin/gh and /config/.gh/config.
GH_HOME = ".gh"
# The gh found by the last status, and its configuration folder (None: gh's own default)
_found: dict[str, str | None] = {"binary": None, "config": None}


def _locate(config_dir: str) -> tuple[str | None, str | None]:
    """The gh to run (the PATH, else the configuration folder's) and its GH_CONFIG_DIR, if any. Blocking."""
    home = os.path.join(config_dir, GH_HOME)
    own = os.path.join(home, "bin", GH)
    conf = os.path.join(home, "config")
    config = conf if os.path.isdir(conf) else None
    if os.path.isfile(own) and os.access(own, os.X_OK):
        return own, config
    return shutil.which(GH), config


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
FULL_NAME_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})/[A-Za-z0-9_][A-Za-z0-9._-]{0,99}$")
# Kept from a template repository's ruleset when it is copied (the rest is its id, links and dates)
RULESET_KEYS = ("name", "target", "enforcement", "conditions", "rules", "bypass_actors")
_LOGIN_RE = re.compile(r"\b(?:account|as)\s+([A-Za-z0-9-]+)")
_URL_RE = re.compile(r"https://github\.com/([^/\s]+/[^/\s]+)")


def _env() -> dict[str, str]:
    """No prompt, colour or update notice: gh runs unattended."""
    env = {
        **os.environ,
        "GH_PROMPT_DISABLED": "1",
        # git (the empty first commit) never waits for a password either
        "GIT_TERMINAL_PROMPT": "0",
        "GH_NO_UPDATE_NOTIFIER": "1",
        "NO_COLOR": "1",
        "CLICOLOR": "0",
    }
    if _found["config"]:
        env["GH_CONFIG_DIR"] = _found["config"]
    return env


async def _run(
    *args: str, stdin: str | None = None, program: str | None = None, cwd: str | None = None
) -> tuple[int, str, str]:
    """Run gh (or ``program``) with these arguments: exit code, stdout, stderr (127 when it cannot be started)."""
    try:
        proc = await asyncio.create_subprocess_exec(
            program or _found["binary"] or GH,
            *args,
            stdin=asyncio.subprocess.PIPE if stdin is not None else asyncio.subprocess.DEVNULL,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=_env(),
        )
    except OSError as exc:
        return 127, "", str(exc)
    try:
        out, err = await asyncio.wait_for(
            proc.communicate(stdin.encode() if stdin is not None else None), TIMEOUT_SECONDS
        )
    except TimeoutError:
        proc.kill()
        await proc.wait()
        return 124, "", "timeout"
    return proc.returncode or 0, out.decode(errors="replace").strip(), err.decode(errors="replace").strip()


def _error(out: str, err: str) -> str:
    """The message gh gave, on one short line."""
    text = (err or out or "gh failed").strip().splitlines()
    return " ".join(line.strip() for line in text if line.strip())[:300] or "gh failed"


async def async_api(*args: str) -> str | None:
    """``gh api`` with these arguments: None, or gh's error."""
    code, out, err = await _run("api", *args)
    return None if code == 0 else _error(out, err)


async def async_status(hass: HomeAssistant, refresh: bool = False) -> dict[str, Any]:
    """Whether gh is installed and signed in on github.com, with the account's login. Cached a minute."""
    data = hass.data.setdefault(DOMAIN, {})
    cached = data.get(STATUS_CACHE)
    if cached and not refresh and time.monotonic() - cached[0] < STATUS_CACHE_SECONDS:
        return cached[1]
    status: dict[str, Any] = {
        "installed": False,
        "authenticated": False,
        "login": None,
        "error": None,
        "path": None,
        "config_dir": None,
    }
    binary, config = await hass.async_add_executor_job(_locate, hass.config.config_dir)
    _found["binary"], _found["config"] = binary, config
    status["path"], status["config_dir"] = binary, config
    if binary is not None:
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


def protections(values: dict[str, Any] | None) -> dict[str, Any]:
    """The protections asked, the defaults filled in (unknown keys dropped)."""
    values = values or {}
    chosen: dict[str, Any] = {key: bool(values.get(key, REPO_DEFAULTS[key])) for key in REPO_PROTECTIONS}
    chosen[CONF_REPO_RULESETS_FROM] = str(values.get(CONF_REPO_RULESETS_FROM, "") or "").strip()
    return chosen


def merge_fields(chosen: dict[str, Any]) -> list[str]:
    """The ``gh api -X PATCH repos/…`` fields of the merge and feature settings."""
    fields: list[str] = []
    if chosen[CONF_REPO_SQUASH_ONLY]:
        fields += ["-F", "allow_squash_merge=true", "-F", "allow_merge_commit=false", "-F", "allow_rebase_merge=false"]
    if chosen[CONF_REPO_SQUASH_PR]:
        fields += ["-f", "squash_merge_commit_title=PR_TITLE", "-f", "squash_merge_commit_message=PR_BODY"]
    fields += ["-F", f"delete_branch_on_merge={str(chosen[CONF_REPO_DELETE_BRANCH]).lower()}"]
    fields += ["-F", f"allow_auto_merge={str(chosen[CONF_REPO_AUTO_MERGE]).lower()}"]
    if chosen[CONF_REPO_NO_WIKI]:
        fields += ["-F", "has_wiki=false", "-F", "has_projects=false"]
    return fields


def builtin_rulesets(chosen: dict[str, Any]) -> list[dict[str, Any]]:
    """The usual rulesets: the default branch (pull requests only, no force push or deletion; squash only and a
    linear history when squash merges only), and the v* tags (no deletion, no move)."""
    rulesets: list[dict[str, Any]] = []
    if chosen[CONF_REPO_PROTECT_BRANCH]:
        squash = chosen[CONF_REPO_SQUASH_ONLY]
        rules: list[dict[str, Any]] = [
            {"type": "deletion"},
            {"type": "non_fast_forward"},
            {
                "type": "pull_request",
                "parameters": {
                    "required_approving_review_count": 0,
                    "dismiss_stale_reviews_on_push": False,
                    "require_code_owner_review": False,
                    "require_last_push_approval": False,
                    "required_review_thread_resolution": False,
                    "allowed_merge_methods": ["squash"] if squash else ["merge", "squash", "rebase"],
                },
            },
        ]
        if squash:
            rules.append({"type": "required_linear_history"})
        rulesets.append(
            {
                "name": "main",
                "target": "branch",
                "enforcement": "active",
                "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
                "rules": rules,
                "bypass_actors": [],
            }
        )
    if chosen[CONF_REPO_PROTECT_TAGS]:
        rulesets.append(
            {
                "name": "tags v*",
                "target": "tag",
                "enforcement": "active",
                "conditions": {"ref_name": {"include": ["refs/tags/v*"], "exclude": []}},
                "rules": [{"type": "deletion"}, {"type": "update"}, {"type": "non_fast_forward"}],
                "bypass_actors": [],
            }
        )
    return rulesets


async def _template_rulesets(source: str) -> tuple[list[dict[str, Any]] | None, str | None]:
    """The rulesets of a template repository, ready to post again; or None and an error."""
    code, out, err = await _run("api", f"repos/{source}/rulesets", "--jq", "[.[].id]")
    if code != 0:
        return None, _error(out, err)
    copied: list[dict[str, Any]] = []
    for ruleset_id in json.loads(out or "[]"):
        code, out, err = await _run("api", f"repos/{source}/rulesets/{int(ruleset_id)}")
        if code != 0:
            return None, _error(out, err)
        ruleset = json.loads(out)
        copied.append({key: ruleset[key] for key in RULESET_KEYS if key in ruleset})
    return copied, None


async def _empty_commit(hass: HomeAssistant, full_name: str) -> str | None:
    """Push an empty first commit to main, as the gh account; an error, or None."""
    git = await hass.async_add_executor_job(shutil.which, "git")
    if git is None:
        return "git is not installed"
    gh = _found["binary"] or GH
    code, out, err = await _run("api", "user")
    if code != 0:
        return _error(out, err)
    user = json.loads(out)
    name = user.get("name") or user["login"]
    email = user.get("email") or f"{user['id']}+{user['login']}@users.noreply.github.com"
    # Made and removed out of the event loop (file system calls)
    work = await hass.async_add_executor_job(tempfile.mkdtemp, None, "github_card_")
    try:
        auth = ["-c", "credential.helper=", "-c", f"credential.helper=!{gh} auth git-credential"]
        for args in (
            ["init", "-q", "-b", "main"],
            [
                "-c",
                f"user.name={name}",
                "-c",
                f"user.email={email}",
                "commit",
                "-q",
                "--allow-empty",
                "-m",
                "chore: initial commit",
            ],
            [*auth, "push", "-q", f"https://github.com/{full_name}.git", "HEAD:main"],
        ):
            code, out, err = await _run(*args, program=git, cwd=work)
            if code != 0:
                return _error(out, err)
    finally:
        await hass.async_add_executor_job(shutil.rmtree, work, True)
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
    protect: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create the repository with gh, then apply the protections and the topics.

    ``{"ok": True, "full_name", "url", "steps": [{"step", "ok", "error"?}]}`` or ``{"ok": False, "error"}``."""
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
    chosen = protections(protect)
    source = chosen[CONF_REPO_RULESETS_FROM]
    if source and not FULL_NAME_RE.match(source):
        return {"ok": False, "error": "invalid_rulesets_from"}
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
    steps: list[dict[str, Any]] = []

    def _step(step: str, error: str | None) -> None:
        steps.append({"step": step, "ok": error is None, **({"error": error} if error else {})})
        if error:
            # Created all the same: the panel says which step failed
            _LOGGER.warning("%s on %s failed: %s", step, full_name, error)

    if chosen[CONF_REPO_EMPTY_COMMIT]:
        _step("empty_commit", await _empty_commit(hass, full_name))
    code, out, err = await _run("api", "--method", "PATCH", f"repos/{full_name}", *merge_fields(chosen))
    _step("merge", None if code == 0 else _error(out, err))
    if topics:
        edit = ["repo", "edit", full_name]
        for topic in topics:
            edit += ["--add-topic", topic]
        code, out, err = await _run(*edit)
        _step("topics", None if code == 0 else _error(out, err))
    if source:
        rulesets, error = await _template_rulesets(source)
        if error is not None:
            _step("rulesets", error)
            rulesets = []
    else:
        rulesets = builtin_rulesets(chosen)
    for ruleset in rulesets:
        code, out, err = await _run(
            "api", "--method", "POST", f"repos/{full_name}/rulesets", "--input", "-", stdin=json.dumps(ruleset)
        )
        _step(f"ruleset:{ruleset.get('name', '')}", None if code == 0 else _error(out, err))
    return {"ok": True, "full_name": full_name, "url": url, "topics": topics, "steps": steps}
