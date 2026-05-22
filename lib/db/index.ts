import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// On Railway: set DATA_DIR=/data (a mounted persistent volume)
// Locally: falls back to ./data inside the project
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(DATA_DIR, 'legal.db'));
sqlite.pragma('journal_mode = WAL');

export { sqlite };
export const db = drizzle(sqlite, { schema });
