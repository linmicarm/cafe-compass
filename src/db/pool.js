import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const useSSL = process.env.PGSSL === 'require' || process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);
