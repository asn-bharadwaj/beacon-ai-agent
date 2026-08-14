import json
import sqlite3
import uuid
from datetime import datetime

DB_FILE = "memory.db"


def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            language_preference TEXT,
            facts TEXT,
            last_interaction TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calls (
            room_name TEXT PRIMARY KEY,
            channel TEXT NOT NULL,
            duration REAL NOT NULL,
            user_turns INTEGER NOT NULL,
            success INTEGER NOT NULL,
            failure_reason TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def lookup_user(name: str) -> dict | None:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, name, language_preference, facts, last_interaction FROM users WHERE LOWER(name) = LOWER(?)",
        (name.strip(),),
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "user_id": row[0],
            "name": row[1],
            "language_preference": row[2],
            "facts": json.loads(row[3]) if row[3] else {},
            "last_interaction": row[4],
        }
    return None


def save_user(name: str, language_preference: str, facts: dict) -> dict:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Check if user already exists
    existing = lookup_user(name)
    timestamp = datetime.now().isoformat()

    if existing:
        user_id = existing["user_id"]
        # Merge facts
        merged_facts = existing["facts"]
        merged_facts.update(facts)

        cursor.execute(
            "UPDATE users SET language_preference = ?, facts = ?, last_interaction = ? WHERE user_id = ?",
            (language_preference, json.dumps(merged_facts), timestamp, user_id),
        )
    else:
        user_id = f"usr_{uuid.uuid4().hex[:8]}"
        cursor.execute(
            "INSERT INTO users (user_id, name, language_preference, facts, last_interaction) VALUES (?, ?, ?, ?, ?)",
            (user_id, name.strip(), language_preference, json.dumps(facts), timestamp),
        )
        merged_facts = facts

    conn.commit()
    conn.close()

    return {
        "user_id": user_id,
        "name": name,
        "language_preference": language_preference,
        "facts": merged_facts,
        "last_interaction": timestamp,
    }


def create_escalation(
    name: str,
    issue: str,
    checked: str,
    urgency: str,
    language: str,
    followup_method: str,
) -> dict:
    import os
    import random

    escalations_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "escalations.json"
    )
    ticket_id = f"TKT-{random.randint(1000, 9999)}"
    timestamp = datetime.now().isoformat()

    ticket = {
        "ticket_id": ticket_id,
        "name": name.strip(),
        "issue": issue.strip(),
        "checked": checked.strip(),
        "urgency": urgency.strip(),
        "language": language.strip(),
        "followup_method": followup_method.strip(),
        "status": "Open",
        "created_at": timestamp,
    }

    # Read existing tickets
    tickets = []
    if os.path.exists(escalations_file):
        try:
            with open(escalations_file, encoding="utf-8") as f:
                tickets = json.load(f)
        except Exception:
            tickets = []

    tickets.append(ticket)

    # Write back
    with open(escalations_file, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2, ensure_ascii=False)

    return ticket


def save_call_record(
    room_name: str,
    channel: str,
    duration: float,
    user_turns: int,
    success: bool,
    failure_reason: str | None = None,
) -> None:
    import os

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()

    cursor.execute(
        """
        INSERT OR REPLACE INTO calls (room_name, channel, duration, user_turns, success, failure_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            room_name,
            channel,
            round(duration, 1),
            user_turns,
            1 if success else 0,
            failure_reason,
            timestamp,
        ),
    )
    conn.commit()

    # Read all calls to export to JSON
    cursor.execute(
        "SELECT room_name, channel, duration, user_turns, success, failure_reason, created_at FROM calls ORDER BY created_at DESC"
    )
    rows = cursor.fetchall()
    conn.close()

    analytics_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "analytics.json"
    )

    calls_list = []
    for r in rows:
        calls_list.append(
            {
                "room_name": r[0],
                "channel": r[1],
                "duration": r[2],
                "user_turns": r[3],
                "success": bool(r[4]),
                "failure_reason": r[5],
                "created_at": r[6],
            }
        )

    with open(analytics_file, "w", encoding="utf-8") as f:
        json.dump(calls_list, f, indent=2, ensure_ascii=False)
