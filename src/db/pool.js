import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// DATABASE_URL, e.g. postgres://user:pass@localhost:5432/cafe_compass
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);
