import postgres from 'postgres';

// Support both DATABASE_URL (manual) and POSTGRES_URL (Supabase-Vercel integration)
const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL)!;

// Single shared connection pool
const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
