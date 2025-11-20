import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const resolveDatabasePath = () => {
  const url = process.env.DATABASE_URL ?? 'file:./data/bookadvisor.sqlite';

  if (url.startsWith('file:')) {
    const target = url.replace('file:', '');
    return path.isAbsolute(target) ? target : path.join(process.cwd(), target);
  }

  if (url.startsWith('sqlite:')) {
    const target = url.replace('sqlite:', '');
    return path.isAbsolute(target) ? target : path.join(process.cwd(), target);
  }

  // Fallback to local file to keep the prototype self contained.
  return path.join(process.cwd(), 'data', 'bookadvisor.sqlite');
};

const dbPath = resolveDatabasePath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reading_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    priority TEXT NOT NULL,
    notes TEXT,
    added_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    rating INTEGER,
    review TEXT,
    date_finished TEXT,
    title TEXT,
    authors TEXT,
    thumbnail TEXT,
    UNIQUE (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS read_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    rating INTEGER,
    review TEXT,
    date_finished TEXT,
    page_count INTEGER,
    authors TEXT,
    categories TEXT,
    title TEXT,
    thumbnail TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, book_id)
  );

  CREATE INDEX IF NOT EXISTS idx_read_books_user_id ON read_books(user_id);
  CREATE INDEX IF NOT EXISTS idx_reading_list_user_id ON reading_list(user_id);
`);

export const ensureUser = (userId: string) => {
  const safeId = userId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 64) || 'guest';
  db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').run(safeId);
  return safeId;
};
