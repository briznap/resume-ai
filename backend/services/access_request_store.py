"""SQLite store for access requests from visitors not on the allowlist.

Mirrors the pattern in signin_store.py and shares the same DB file
(SIGNIN_DB_PATH, WAL mode, ../data volume) — a new `access_requests` table,
not a new database. Rows record who asked for an invite, an optional note,
and the requesting IP.

Dedup contract: record_access_request() checks for an existing request from
the same email in the last 24 hours. A repeat inside that window is NOT
recorded again (no duplicate row) and returns False so the caller can skip
the notification email; the visitor still sees the same generic success.

Resilience contract: record_access_request() must NEVER break the request
flow — it swallows and logs any error rather than propagating. On a DB error
it returns False (fail-safe: no row implies no notification, so an outage
can't cause notification spam). The query helper is only reached by the admin
API and may raise.
"""

import logging
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

logger = logging.getLogger("resume-ai")

DEDUP_WINDOW_HOURS = 24

_initialized = False


def _db_path() -> Path:
    # Same file as the sign-in store — read at call time (not import) so it's
    # available after load_dotenv().
    return Path(os.getenv("SIGNIN_DB_PATH", "/app/data/signins.db"))


@contextmanager
def _connect():
    """Open a short-lived connection. SQLite handles open/close cheaply, and a
    fresh connection per call sidesteps cross-thread sharing concerns."""
    conn = sqlite3.connect(_db_path(), timeout=5.0)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        conn.close()


def init_store() -> None:
    """Create the data directory, table, and indexes; enable WAL. Idempotent;
    called once at startup. Safe to call again — guarded so the schema work
    only runs once per process."""
    global _initialized
    if _initialized:
        return
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        # WAL persists on the file once set (signin_store sets it too);
        # harmless to re-issue.
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS access_requests (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                email        TEXT    NOT NULL,
                note         TEXT,
                requested_at TEXT    NOT NULL,
                ip_address   TEXT    NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_access_requests_requested_at "
            "ON access_requests(requested_at)"
        )
        conn.commit()
    _initialized = True


def record_access_request(email: str, note: str | None, ip_address: str) -> bool:
    """Insert one access request unless the same email already requested within
    the last 24 hours. Returns True if a new row was recorded (caller should
    notify), False on a deduped repeat or any DB error. Never raises."""
    try:
        if not _initialized:
            init_store()
        email = email.strip().lower()
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=DEDUP_WINDOW_HOURS)).isoformat()
        with _connect() as conn:
            (recent,) = conn.execute(
                # requested_at is ISO 8601 UTC (always +00:00), so lexicographic
                # comparison is chronological.
                "SELECT COUNT(*) FROM access_requests WHERE email = ? AND requested_at >= ?",
                (email, cutoff),
            ).fetchone()
            if recent:
                return False
            conn.execute(
                "INSERT INTO access_requests (email, note, requested_at, ip_address) "
                "VALUES (?, ?, ?, ?)",
                (email, note, datetime.now(timezone.utc).isoformat(), ip_address),
            )
            conn.commit()
        return True
    except Exception:  # noqa: BLE001 — recording must never break the request path
        logger.exception("Failed to record access request to the database")
        return False


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "note": row["note"],
        "requested_at": row["requested_at"],
        "ip_address": row["ip_address"],
    }


def list_access_requests(
    email: str | None = None, days: int | None = None, limit: int | None = None
) -> list[dict]:
    """Return matching access-request rows, most recent first. id is monotonic,
    so ORDER BY id DESC is a stable recency order even within the same
    timestamp."""
    clauses: list[str] = []
    params: list = []
    if email:
        clauses.append("email = ?")
        params.append(email.strip().lower())
    if days is not None:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        clauses.append("requested_at >= ?")
        params.append(cutoff)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = (
        "SELECT id, email, note, requested_at, ip_address FROM access_requests"
        f"{where} ORDER BY id DESC"
    )
    if limit is not None:
        sql += " LIMIT ?"
        params.append(limit)
    with _connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(row) for row in rows]
