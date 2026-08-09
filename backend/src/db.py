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
