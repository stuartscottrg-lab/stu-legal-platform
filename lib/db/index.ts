// Supabase / Postgres — primary database
export { default as sql } from './pg';

// SQLite kept as legacy fallback (local dev without DATABASE_URL)
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _db: Database.Database | null = null;

function getDB(): Database.Database {
  if (!_db) {
    const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    _db = new Database(path.join(DATA_DIR, 'legal.db'));
    _db.pragma('journal_mode = WAL');
  }
  return _db;
}

export const sqlite = new Proxy({} as Database.Database, {
  get(_, prop: string | symbol) {
    return (getDB() as any)[prop];
  },
});
