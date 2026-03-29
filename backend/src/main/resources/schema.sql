-- Enable foreign key enforcement (required for SQLite)
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'USER',
    created_at    TEXT    NOT NULL,
    deleted_at    TEXT    DEFAULT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER NOT NULL,
    service_type       TEXT    NOT NULL,
    device_description TEXT    NOT NULL,
    notes              TEXT,
    status             TEXT    NOT NULL DEFAULT 'Pending',
    created_at         TEXT    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    subject    TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'Open',
    created_at TEXT    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat sessions table (request-based, linked to order or enquiry)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    ref_type            TEXT    NOT NULL,
    ref_id              INTEGER NOT NULL,
    subject             TEXT    NOT NULL,
    status              TEXT    NOT NULL DEFAULT 'PENDING',
    created_at          TEXT    NOT NULL,
    accepted_at         TEXT    DEFAULT NULL,
    unread_user         INTEGER NOT NULL DEFAULT 0,
    unread_admin        INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL,
    sender_id       INTEGER NOT NULL,
    sender_role     TEXT    NOT NULL,  -- 'USER' or 'ADMIN'
    message_type    TEXT    NOT NULL DEFAULT 'TEXT',  -- 'TEXT' or 'IMAGE'
    content         TEXT    NOT NULL,  -- text content or base64 image data
    image_mime_type TEXT    DEFAULT NULL,
    sent_at         TEXT    NOT NULL,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
