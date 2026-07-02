const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// Single SQLite file persisted to disk so chat history survives restarts.
// Uses Node's built-in sqlite module (available in Node 22+) instead of a
// native addon like better-sqlite3, so there's no C++ compiler / build
// toolchain required to install this project.
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "chat.db");
const db = new DatabaseSync(DB_PATH);

// --- Schema ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
`);

// --- Prepared statements ---------------------------------------------------
const insertMessageStmt = db.prepare(
  `INSERT INTO messages (id, username, text, created_at) VALUES (?, ?, ?, ?)`
);

const getHistoryStmt = db.prepare(
  `SELECT id, username, text, created_at as createdAt
   FROM messages
   ORDER BY created_at ASC
   LIMIT ?`
);

function saveMessage(message) {
  insertMessageStmt.run(
    message.id,
    message.username,
    message.text,
    message.createdAt
  );
  return message;
}

function getHistory(limit = 200) {
  return getHistoryStmt.all(limit);
}

module.exports = { db, saveMessage, getHistory };
