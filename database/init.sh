#!/bin/sh
# Initialize the SQLite database file if it doesn't already exist
DB_FILE="/data/repairshop.db"

if [ ! -f "$DB_FILE" ]; then
    echo "Initializing SQLite database at $DB_FILE..."
    sqlite3 "$DB_FILE" "PRAGMA journal_mode=WAL;"
    echo "Database initialized."
else
    echo "Database already exists at $DB_FILE, skipping initialization."
fi
