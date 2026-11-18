import pg from 'pg';

export const DEFAULT_DATABASE_URL = 'postgres://knit:knit@localhost:5433/knitting';

const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

// Hosted Postgres (Neon, Supabase, Render) requires TLS; local Docker does not.
const needsSsl = /sslmode=require|neon\.tech|supabase\.co|render\.com/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export function query(text, params) {
  return pool.query(text, params);
}
