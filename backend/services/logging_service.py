"""Structured JSON event logging.

Events are appended as single JSON lines to LOG_PATH (default
/app/logs/resume-ai.log — bind-mounted to ../logs by docker-compose) via a
RotatingFileHandler (10 MB x 5 backups). The handler is initialized lazily on
first use; if the log location isn't writable (e.g. local dev without a logs
dir, or a root-owned mount the non-root container user can't write), events
fall back to the standard application logger — logging must never take the
app down.

Event lines look like:
    {"ts": "2026-06-10T17:03:21.481+00:00", "event": "auth", "email": "...", "result": "denied"}

`ts` (ISO 8601, UTC) and `event` are always present; everything else is
event-specific. NEVER log secrets or session token values — emails and chat
message text are the most sensitive fields that belong here.
"""

import json
import logging
import os
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path

logger = logging.getLogger("resume-ai")

MAX_BYTES = 10 * 1024 * 1024  # rotate at 10 MB
BACKUP_COUNT = 5

_event_logger: logging.Logger | None = None
_init_failed = False


def _log_path() -> Path:
    # Read at call time (not import) so it's available after load_dotenv().
    return Path(os.getenv("LOG_PATH", "/app/logs/resume-ai.log"))


def _get_event_logger() -> logging.Logger | None:
    """Lazily build the file-backed event logger. Returns None (and remembers
    the failure) if the log path can't be opened for writing."""
    global _event_logger, _init_failed
    if _event_logger is not None or _init_failed:
        return _event_logger

    path = _log_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        handler = RotatingFileHandler(
            path, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT, encoding="utf-8"
        )
    except OSError as exc:
        _init_failed = True
        logger.warning(
            "Event log file unavailable at %s (%s); structured events will only "
            "appear in the application log.",
            path,
            exc,
        )
        return None

    handler.setFormatter(logging.Formatter("%(message)s"))  # the message IS the JSON line
    event_logger = logging.getLogger("resume-ai.events")
    event_logger.setLevel(logging.INFO)
    event_logger.propagate = False  # keep raw JSON lines out of the console log
    event_logger.addHandler(handler)
    _event_logger = event_logger
    return _event_logger


def log_event(event: str, **fields) -> None:
    """Append one structured event as a single JSON line. Never raises."""
    payload = {"ts": datetime.now(timezone.utc).isoformat(), "event": event, **fields}
    try:
        line = json.dumps(payload, ensure_ascii=False, default=str)
    except (TypeError, ValueError):  # defensive; default=str makes this unlikely
        logger.warning("Dropped unserializable event %r", event)
        return

    event_logger = _get_event_logger()
    if event_logger is not None:
        event_logger.info(line)
    else:
        logger.info("event %s", line)


def read_recent_events(limit: int = 100) -> list[dict]:
    """Parse the last `limit` JSON lines of the current log file.

    Rotated backups are not included. Lines that fail to parse (e.g. truncated
    by rotation) are skipped. Returns [] if the file doesn't exist yet.
    """
    try:
        lines = _log_path().read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return []
    except OSError as exc:
        logger.warning("Could not read event log: %s", exc)
        return []

    events: list[dict] = []
    for line in lines[-limit:]:
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            events.append(obj)
    return events
