import { query } from '../db/pool.js';

// GET /api/vibes  — for building the filter UI
export async function listVibes(req, res, next) {
  try {
    const { rows } = await query('SELECT id, label FROM vibes ORDER BY label ASC;');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
