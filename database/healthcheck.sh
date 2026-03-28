#!/bin/sh
# Health check: verify the SQLite database file exists
DB_FILE="/data/repairshop.db"

if [ -f "$DB_FILE" ]; then
    exit 0
else
    echo "Database file not found: $DB_FILE"
    exit 1
fi
