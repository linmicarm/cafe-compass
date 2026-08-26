import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// DATABASE_URL, e.g. postgres://user:pass@localhost:5432/cafe_compass
// Managed Postgres (Render, Neon, etc.) requires SSL; local dev does not.
// PGSSL=require turns it on in production without hardcoding.
const useSSL = process.env.PGSSL === 'require' || process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);
