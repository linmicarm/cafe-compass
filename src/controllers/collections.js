import { query } from '../db/pool.js';

// GET /api/collections  — each with its café count
export async function listCollections(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT col.id, col.name, col.description,
             COUNT(cc.cafe_id) AS cafe_count
      FROM collections col
      LEFT JOIN collection_cafes cc ON cc.collection_id = col.id
      GROUP BY col.id
      ORDER BY col.name ASC;
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/collections/:id  — collection + its cafés
export async function getCollection(req, res, next) {
  try {
    const { id } = req.params;

    const col = await query(
      'SELECT id, name, description FROM collections WHERE id = $1',
      [id]
    );
    if (!col.rows.length) return res.status(404).json({ error: 'Collection not found' });

    const cafes = await query(
      `SELECT c.id, c.name, c.neighborhood, c.wifi, c.noise, c.outlets,
              COALESCE(cr.avg_rating, 0) AS avg_rating
       FROM collection_cafes cc
       JOIN cafes c        ON c.id = cc.cafe_id
       LEFT JOIN cafe_ratings cr ON cr.cafe_id = c.id
       WHERE cc.collection_id = $1
       ORDER BY c.name ASC;`,
      [id]
    );

    res.json({ ...col.rows[0], cafes: cafes.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/collections/:id/cafes  — { cafe_id }
export async function addCafeToCollection(req, res, next) {
  try {
    const { id } = req.params;
    const { cafe_id } = req.body;
    if (!cafe_id) return res.status(400).json({ error: 'cafe_id is required' });

    await query(
      `INSERT INTO collection_cafes (collection_id, cafe_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING;`,
      [id, cafe_id]
    );
    res.status(201).json({ collection_id: Number(id), cafe_id });
  } catch (err) {
    next(err);
  }
}
