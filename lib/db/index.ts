import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Lazy singleton — database is NOT opened at import time.
// This prevents SQLITE_BUSY during Next.js build (module analysis phase).
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

// Proxy so all existing callers (sqlite.prepare etc.) work unchanged
export const sqlite = new Proxy({} as Database.Database, {
  get(_, prop: string | symbol) {
    return (getDB() as any)[prop];
  },
});

// drizzle only needed at runtime too
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop: string | symbol) {
    return (drizzle(getDB(), { schema }) as any)[prop];
  },
});
