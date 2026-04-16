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

-- Orders table (E-Commerce)
CREATE TABLE IF NOT EXISTS orders (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER NOT NULL,
    total_price        REAL    NOT NULL DEFAULT 0,
    shipping_address   TEXT,
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
    sender_role     TEXT    NOT NULL,
    message_type    TEXT    NOT NULL DEFAULT 'TEXT',
    content         TEXT    NOT NULL,
    image_mime_type TEXT    DEFAULT NULL,
    sent_at         TEXT    NOT NULL,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Catalogue items table
CREATE TABLE IF NOT EXISTS catalogue_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id   TEXT    UNIQUE NOT NULL,  -- e.g. PROD-0001
    name         TEXT    NOT NULL,
    category     TEXT    NOT NULL,         -- Laptop, RAM, SSD, Router, Pendrive, Other
    description  TEXT,
    price        REAL    NOT NULL DEFAULT 0,
    stock        INTEGER NOT NULL DEFAULT 0,
    brand        TEXT,
    model        TEXT,
    specs        TEXT,                     -- JSON string of key-value specs
    image_base64 TEXT,                     -- optional product image
    available    INTEGER NOT NULL DEFAULT 1,  -- 1=available, 0=unavailable
    created_at   TEXT    NOT NULL,
    updated_at   TEXT    NOT NULL
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    product_id      TEXT    NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES catalogue_items(product_id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER NOT NULL,
    product_id          TEXT    NOT NULL,
    quantity            INTEGER NOT NULL DEFAULT 1,
    price_at_purchase   REAL    NOT NULL,
    created_at          TEXT    NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES catalogue_items(product_id)
);
