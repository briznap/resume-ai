"""SQLite store for sign-in attempts.

A small file-backed table recording every sign-in attempt — admitted *or*
denied — as a durable, queryable complement to the structured JSON event log.
The log keeps writing exactly as before (see logging_service.log_event); this
store is purely additive and is the source of truth for sign-in *data*.

The DB file lives at SIGNIN_DB_PATH (default /app/data/signins.db, a writable
bind-mounted volume) so it survives container rebuilds. It is gitignored and
never committed. WAL journaling is enabled so reads (admin queries) don't block
the single-writer sign-in path.

Resilience contract: record_signin() must NEVER break the sign-in flow — it
swallows and logs any error rather than propagating it into the request
handler. The query helpers are only reached by the admin API and may raise.
"""

import logging
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

logger = logging.getLogger("resume-ai")

# Single profile today; the column exists so a future multi-profile deployment
# doesn't need a schema migration. Override via env if/when that arrives.
DEFAULT_PROFILE_SLUG = "brad-belnap"

_initialized = False


def _db_path() -> Path:
    # Read at call time (not import) so it's available after load_dotenv().
    return Path(os.getenv("SIGNIN_DB_PATH", "/app/data/signins.db"))


def _profile_slug() -> str:
    return os.getenv("PROFILE_SLUG", DEFAULT_PROFILE_SLUG)


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
        # WAL persists on the file once set; concurrent admin reads then don't
        # block the writer. Harmless to re-issue.
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS signins (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                ts           TEXT    NOT NULL,
                email        TEXT    NOT NULL,
                profile_slug TEXT    NOT NULL,
                success      INTEGER NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_signins_email ON signins(email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_signins_ts ON signins(ts)")
        conn.commit()
    _initialized = True


def record_signin(email: str, success: bool, profile_slug: str | None = None) -> None:
    """Insert one sign-in attempt. Never raises — a DB hiccup must not turn a
    valid sign-in into a 500. Errors are logged and dropped."""
    try:
        if not _initialized:
            init_store()
        with _connect() as conn:
            conn.execute(
                "INSERT INTO signins (ts, email, profile_slug, success) VALUES (?, ?, ?, ?)",
                (
                    datetime.now(timezone.utc).isoformat(),
                    email,
                    profile_slug or _profile_slug(),
                    1 if success else 0,
                ),
            )
            conn.commit()
    except Exception:  # noqa: BLE001 — logging must never break the request path
        logger.exception("Failed to record sign-in to the database")


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "ts": row["ts"],
        "email": row["email"],
        "profile_slug": row["profile_slug"],
        "success": bool(row["success"]),
    }


def _build_filters(email: str | None, days: int | None) -> tuple[str, list]:
    """Assemble a parameterized WHERE clause from the optional filters."""
    clauses: list[str] = []
    params: list = []
    if email:
        clauses.append("email = ?")
        params.append(email.strip().lower())
    if days is not None:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        # ts is stored as ISO 8601 UTC (always +00:00), so lexicographic
        # comparison is chronological.
        clauses.append("ts >= ?")
        params.append(cutoff)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    return where, params


def query_signins(
    email: str | None = None, days: int | None = None, limit: int | None = None
) -> list[dict]:
    """Return matching sign-in rows, most recent first. id is monotonic, so
    ORDER BY id DESC is a stable recency order even within the same timestamp."""
    where, params = _build_filters(email, days)
    sql = f"SELECT id, ts, email, profile_slug, success FROM signins{where} ORDER BY id DESC"
    if limit is not None:
        sql += " LIMIT ?"
        params.append(limit)
    with _connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(row) for row in rows]


def count_signins(email: str | None = None, days: int | None = None) -> int:
    """Count sign-in rows matching the optional filters."""
    where, params = _build_filters(email, days)
    with _connect() as conn:
        (count,) = conn.execute(f"SELECT COUNT(*) FROM signins{where}", params).fetchone()
    return count
