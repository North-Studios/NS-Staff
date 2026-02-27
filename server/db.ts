import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "base.db");

// Single shared SQLite connection
export const db = new Database(DB_PATH);

// Basic pragmas for safer defaults
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run lightweight migrations on startup
export function migrate() {
  // Developers table (backend name; exposed as /api/developers)
  // id = Telegram ID (passed via API when creating)
  db.exec(`
    CREATE TABLE IF NOT EXISTS developers (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      name_json TEXT NOT NULL,
      nicknames_json TEXT NOT NULL,
      age INTEGER,
      country TEXT,
      languages_json TEXT NOT NULL,
      post TEXT,
      description_json TEXT,
      contacts_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description_json TEXT,
      tags_json TEXT,
      developers_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Articles / news table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,              -- 8-char slug
      title_json TEXT NOT NULL,
      summary_json TEXT,
      content_json TEXT NOT NULL,
      banner_url TEXT,
      author_endpoint TEXT,
      author_avatar_url TEXT,
      tags_json TEXT,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Uploaded files metadata (avatars, covers, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      type TEXT,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

