import os

import db


def test_sqlite_memory_flow():
    # Set to a test database file
    db.DB_FILE = "test_memory.db"

    # Ensure starting from a clean state
    if os.path.exists(db.DB_FILE):
        os.remove(db.DB_FILE)

    db.init_db()

    # Verify searching non-existent user returns None
    assert db.lookup_user("Ramesh") is None

    # Verify save operations
    facts = {
        "current_level": "Beginner",
        "topics_covered": "Gravity",
        "mistakes": "confusing mass and weight",
    }
    saved = db.save_user("Ramesh", "Hindi", facts)
    assert saved["name"] == "Ramesh"
    assert saved["language_preference"] == "Hindi"
    assert saved["facts"]["current_level"] == "Beginner"
    assert saved["user_id"].startswith("usr_")

    # Verify retrieval
    profile = db.lookup_user("Ramesh")
    assert profile is not None
    assert profile["user_id"] == saved["user_id"]
    assert profile["facts"]["topics_covered"] == "Gravity"

    # Verify case-insensitive lookup matches
    profile_lower = db.lookup_user("ramesh")
    assert profile_lower is not None
    assert profile_lower["user_id"] == saved["user_id"]

    # Verify details updating and fact merging works
    new_facts = {"topics_covered": "Gravity, Orbit", "current_level": "Intermediate"}
    updated = db.save_user("Ramesh", "Hindi", new_facts)
    assert updated["facts"]["topics_covered"] == "Gravity, Orbit"
    assert updated["facts"]["current_level"] == "Intermediate"
    assert updated["facts"]["mistakes"] == "confusing mass and weight"

    # Clean up test database
    if os.path.exists(db.DB_FILE):
        os.remove(db.DB_FILE)
