// Runs schema.sql then seed.sql through the pg pool — no psql binary needed.
// Works locally and on hosts (Render, etc.) where psql isn't installed.
//   npm run db:setup
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const here = dirname(fileURLToPath(import.meta.url));
const dbDir = join(here, '..', '..', 'db');

async function run(file) {
  const sql = readFileSync(join(dbDir, file), 'utf8');
  await pool.query(sql);
  console.log(`✓ ran ${file}`);
}

try {
  await run('schema.sql');
  await run('seed.sql');
  console.log('Database ready.');
  await pool.end();
} catch (err) {
  console.error('Setup failed:', err.message);
  await pool.end();
  process.exit(1);
}
