"""
MedAI Database — SQLite for users, sessions, search logs, and chat history.
"""

import sqlite3
import os
import uuid
from datetime import datetime, timezone
from contextlib import contextmanager

# Use /data/medai.db inside Docker (volume-mounted), or local file otherwise
_data_dir = os.environ.get("MEDAI_DATA_DIR", os.path.dirname(__file__))
DB_PATH = os.path.join(_data_dir, "medai.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL,
                last_login TEXT
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS search_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                query TEXT NOT NULL,
                response_preview TEXT,
                sources TEXT,
                risk_level TEXT,
                created_at TEXT NOT NULL,
                duration_ms INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                analysis_json TEXT,
                created_at TEXT NOT NULL,
                session_id TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS report_uploads (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                filename TEXT NOT NULL,
                chunks_indexed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                preferences_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS vitals_log (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                heart_rate REAL,
                blood_pressure_sys REAL,
                blood_pressure_dia REAL,
                temperature REAL,
                spo2 REAL,
                blood_sugar REAL,
                weight REAL,
                notes TEXT,
                recorded_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
    print("✅ Database initialized at", DB_PATH)


# --- User Operations ---

def create_user(email: str, name: str, password_hash: str, role: str = "user") -> dict:
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, name, password_hash, role, now),
        )
    return {"id": user_id, "email": email, "name": name, "role": role, "created_at": now}


def get_user_by_email(email: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def update_last_login(user_id: str):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user_id))


def get_all_users() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, email, name, role, created_at, last_login FROM users ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def get_user_count() -> int:
    with get_db() as conn:
        return conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]


def delete_user(user_id: str) -> bool:
    """Delete a user and all their associated data (cascades via FK)."""
    with get_db() as conn:
        # Delete related records first (since some FKs use SET NULL, not CASCADE)
        conn.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM search_logs WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM report_uploads WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        result = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return result.rowcount > 0


def update_user_role(user_id: str, role: str) -> bool:
    """Update a user's role."""
    with get_db() as conn:
        result = conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        return result.rowcount > 0


# --- Session Operations ---

def create_session(user_id: str, token: str, expires_at: str, ip_address: str = None, user_agent: str = None) -> str:
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sessions (id, user_id, token, created_at, expires_at, is_active, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
            (session_id, user_id, token, now, expires_at, ip_address, user_agent),
        )
    return session_id


def deactivate_session(token: str):
    with get_db() as conn:
        conn.execute("UPDATE sessions SET is_active = 0 WHERE token = ?", (token,))


def get_active_sessions(user_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_all_sessions(limit: int = 100) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """SELECT s.id, s.user_id, u.email, u.name, s.created_at, s.is_active, s.ip_address, s.user_agent
               FROM sessions s LEFT JOIN users u ON s.user_id = u.id
               ORDER BY s.created_at DESC LIMIT ?""",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_active_session_count() -> int:
    with get_db() as conn:
        return conn.execute("SELECT COUNT(*) FROM sessions WHERE is_active = 1").fetchone()[0]


# --- Search Log Operations ---

def log_search(user_id: str | None, query: str, response_preview: str = None,
               sources: str = None, risk_level: str = None, duration_ms: int = None):
    log_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        try:
            conn.execute(
                "INSERT INTO search_logs (id, user_id, query, response_preview, sources, risk_level, created_at, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (log_id, user_id, query, response_preview, sources, risk_level, now, duration_ms),
            )
        except sqlite3.IntegrityError:
            conn.execute(
                "INSERT INTO search_logs (id, user_id, query, response_preview, sources, risk_level, created_at, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (log_id, None, query, response_preview, sources, risk_level, now, duration_ms),
            )
    return log_id


def get_search_logs(limit: int = 100, user_id: str = None) -> list[dict]:
    with get_db() as conn:
        if user_id:
            rows = conn.execute(
                """SELECT sl.*, u.email, u.name FROM search_logs sl
                   LEFT JOIN users u ON sl.user_id = u.id
                   WHERE sl.user_id = ?
                   ORDER BY sl.created_at DESC LIMIT ?""",
                (user_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT sl.*, u.email, u.name FROM search_logs sl
                   LEFT JOIN users u ON sl.user_id = u.id
                   ORDER BY sl.created_at DESC LIMIT ?""",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]


def get_search_count(user_id: str = None) -> int:
    with get_db() as conn:
        if user_id:
            return conn.execute("SELECT COUNT(*) FROM search_logs WHERE user_id = ?", (user_id,)).fetchone()[0]
        return conn.execute("SELECT COUNT(*) FROM search_logs").fetchone()[0]


def get_search_stats() -> dict:
    """Get aggregated search statistics."""
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM search_logs").fetchone()[0]
        today = conn.execute(
            "SELECT COUNT(*) FROM search_logs WHERE date(created_at) = date('now')"
        ).fetchone()[0]
        avg_duration = conn.execute(
            "SELECT AVG(duration_ms) FROM search_logs WHERE duration_ms IS NOT NULL"
        ).fetchone()[0]

        # Top queries (by frequency)
        top_queries = conn.execute(
            """SELECT query, COUNT(*) as count FROM search_logs
               GROUP BY query ORDER BY count DESC LIMIT 10"""
        ).fetchall()

        # Daily counts for last 7 days
        daily_counts = conn.execute(
            """SELECT date(created_at) as day, COUNT(*) as count
               FROM search_logs
               WHERE created_at >= datetime('now', '-7 days')
               GROUP BY date(created_at)
               ORDER BY day"""
        ).fetchall()

        return {
            "total": total,
            "today": today,
            "avg_duration_ms": round(avg_duration, 1) if avg_duration else 0,
            "top_queries": [{"query": r["query"], "count": r["count"]} for r in top_queries],
            "daily_counts": [{"day": r["day"], "count": r["count"]} for r in daily_counts],
        }


# --- Chat History Operations ---

def log_chat_message(user_id: str | None, role: str, content: str, analysis_json: str = None, session_id: str = None):
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        try:
            conn.execute(
                "INSERT INTO chat_history (id, user_id, role, content, analysis_json, created_at, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (msg_id, user_id, role, content, analysis_json, now, session_id),
            )
        except sqlite3.IntegrityError:
            # user_id not in users table (e.g. stale JWT from another DB) — log without user
            conn.execute(
                "INSERT INTO chat_history (id, user_id, role, content, analysis_json, created_at, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (msg_id, None, role, content, analysis_json, now, session_id),
            )
    return msg_id


def get_chat_history(user_id: str = None, limit: int = 100) -> list[dict]:
    with get_db() as conn:
        if user_id:
            rows = conn.execute(
                "SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT ch.*, u.email, u.name FROM chat_history ch
                   LEFT JOIN users u ON ch.user_id = u.id
                   ORDER BY ch.created_at DESC LIMIT ?""",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]


# --- Report Upload Operations ---

def log_report_upload(user_id: str | None, filename: str, chunks_indexed: int):
    upload_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        try:
            conn.execute(
                "INSERT INTO report_uploads (id, user_id, filename, chunks_indexed, created_at) VALUES (?, ?, ?, ?, ?)",
                (upload_id, user_id, filename, chunks_indexed, now),
            )
        except sqlite3.IntegrityError:
            conn.execute(
                "INSERT INTO report_uploads (id, user_id, filename, chunks_indexed, created_at) VALUES (?, ?, ?, ?, ?)",
                (upload_id, None, filename, chunks_indexed, now),
            )
    return upload_id


def get_report_uploads(user_id: str = None, limit: int = 50) -> list[dict]:
    with get_db() as conn:
        if user_id:
            rows = conn.execute(
                "SELECT * FROM report_uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT ru.*, u.email, u.name FROM report_uploads ru
                   LEFT JOIN users u ON ru.user_id = u.id
                   ORDER BY ru.created_at DESC LIMIT ?""",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]


def delete_report(report_id: str, user_id: str) -> dict | None:
    """Delete a specific report by ID (only if owned by the user). Returns the deleted row as dict, or None."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM report_uploads WHERE id = ? AND user_id = ?",
            (report_id, user_id),
        ).fetchone()
        if not row:
            return None
        result = dict(row)
        conn.execute("DELETE FROM report_uploads WHERE id = ? AND user_id = ?", (report_id, user_id))
        return result


# --- User Preferences Operations ---

def get_user_preferences(user_id: str) -> dict:
    """Get a user's preferences as a dict."""
    import json
    with get_db() as conn:
        row = conn.execute("SELECT preferences_json FROM user_preferences WHERE user_id = ?", (user_id,)).fetchone()
        if row:
            try:
                return json.loads(row["preferences_json"])
            except Exception:
                return {}
        return {}


def save_user_preferences(user_id: str, preferences: dict) -> dict:
    """Save (upsert) a user's preferences."""
    import json
    now = datetime.now(timezone.utc).isoformat()
    pref_json = json.dumps(preferences)
    with get_db() as conn:
        conn.execute(
            """INSERT INTO user_preferences (user_id, preferences_json, updated_at)
               VALUES (?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET preferences_json = excluded.preferences_json, updated_at = excluded.updated_at""",
            (user_id, pref_json, now),
        )
    return preferences


# --- Vitals Log Operations ---

def log_vitals(user_id: str, heart_rate: float = None, blood_pressure_sys: float = None,
               blood_pressure_dia: float = None, temperature: float = None, spo2: float = None,
               blood_sugar: float = None, weight: float = None, notes: str = None) -> dict:
    """Log a vitals entry for a user."""
    vital_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        try:
            conn.execute(
                """INSERT INTO vitals_log (id, user_id, heart_rate, blood_pressure_sys, blood_pressure_dia,
                   temperature, spo2, blood_sugar, weight, notes, recorded_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (vital_id, user_id, heart_rate, blood_pressure_sys, blood_pressure_dia,
                 temperature, spo2, blood_sugar, weight, notes, now),
            )
        except sqlite3.IntegrityError:
            # user_id not in users table — skip logging rather than crash
            pass
    return {
        "id": vital_id, "user_id": user_id,
        "heart_rate": heart_rate, "blood_pressure_sys": blood_pressure_sys,
        "blood_pressure_dia": blood_pressure_dia, "temperature": temperature,
        "spo2": spo2, "blood_sugar": blood_sugar, "weight": weight,
        "notes": notes, "recorded_at": now,
    }


def get_vitals(user_id: str, limit: int = 50) -> list[dict]:
    """Get a user's vitals history, most recent first."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM vitals_log WHERE user_id = ? ORDER BY recorded_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


def get_latest_vitals(user_id: str) -> dict | None:
    """Get the most recent vitals entry for a user."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM vitals_log WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


# --- Admin Stats ---

def get_admin_overview() -> dict:
    """Get complete admin dashboard overview."""
    with get_db() as conn:
        users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        active_sessions = conn.execute("SELECT COUNT(*) FROM sessions WHERE is_active = 1").fetchone()[0]
        total_searches = conn.execute("SELECT COUNT(*) FROM search_logs").fetchone()[0]
        today_searches = conn.execute(
            "SELECT COUNT(*) FROM search_logs WHERE date(created_at) = date('now')"
        ).fetchone()[0]
        total_reports = conn.execute("SELECT COUNT(*) FROM report_uploads").fetchone()[0]
        total_chats = conn.execute("SELECT COUNT(*) FROM chat_history").fetchone()[0]

        # New users today
        new_users_today = conn.execute(
            "SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')"
        ).fetchone()[0]

        # Recent users
        recent_users = conn.execute(
            "SELECT id, email, name, role, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 5"
        ).fetchall()

        # Recent searches
        recent_searches = conn.execute(
            """SELECT sl.query, sl.created_at, sl.risk_level, sl.duration_ms, u.email
               FROM search_logs sl LEFT JOIN users u ON sl.user_id = u.id
               ORDER BY sl.created_at DESC LIMIT 10"""
        ).fetchall()

        return {
            "total_users": users,
            "new_users_today": new_users_today,
            "active_sessions": active_sessions,
            "total_searches": total_searches,
            "today_searches": today_searches,
            "total_reports": total_reports,
            "total_chats": total_chats,
            "recent_users": [dict(r) for r in recent_users],
            "recent_searches": [dict(r) for r in recent_searches],
        }
