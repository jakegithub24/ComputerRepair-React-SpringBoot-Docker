package com.repairshop.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Applies incremental schema migrations that cannot be expressed in schema.sql
 * (which uses CREATE TABLE IF NOT EXISTS and won't add new columns to existing tables).
 */
@Component
@Order(1) // run before AdminSeeder
public class DatabaseMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigration.class);
    private final JdbcTemplate jdbc;

    public DatabaseMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("users", "deleted_at", "TEXT DEFAULT NULL");
        createTableIfMissing("chat_sessions",
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "user_id INTEGER NOT NULL, " +
            "ref_type TEXT NOT NULL, " +
            "ref_id INTEGER NOT NULL, " +
            "subject TEXT NOT NULL, " +
            "status TEXT NOT NULL DEFAULT 'PENDING', " +
            "created_at TEXT NOT NULL, " +
            "accepted_at TEXT DEFAULT NULL"
        );
        createTableIfMissing("chat_messages",
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "session_id INTEGER NOT NULL, " +
            "sender_id INTEGER NOT NULL, " +
            "sender_role TEXT NOT NULL, " +
            "message_type TEXT NOT NULL DEFAULT 'TEXT', " +
            "content TEXT NOT NULL, " +
            "image_mime_type TEXT DEFAULT NULL, " +
            "sent_at TEXT NOT NULL"
        );
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        try {
            var rows = jdbc.queryForList("PRAGMA table_info(" + table + ")");
            boolean exists = rows.stream()
                    .anyMatch(row -> column.equalsIgnoreCase((String) row.get("name")));
            if (!exists) {
                jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
                log.info("Migration: added column '{}.{}'", table, column);
            }
        } catch (Exception e) {
            log.warn("Migration check for '{}.{}' skipped: {}", table, column, e.getMessage());
        }
    }

    private void createTableIfMissing(String table, String columnDefs) {
        try {
            jdbc.execute("CREATE TABLE IF NOT EXISTS " + table + " (" + columnDefs + ")");
            log.info("Migration: ensured table '{}' exists", table);
        } catch (Exception e) {
            log.warn("Migration for table '{}' skipped: {}", table, e.getMessage());
        }
    }
}
