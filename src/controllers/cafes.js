import { query } from '../db/pool.js';

// GET /api/cafes
// Filters (all optional, all AND-combined):
//   ?wifi=strong,blazing        (any-of, enum)
//   ?noise=silent,quiet         (any-of, enum)
//   ?outlets=some,plenty        (any-of, enum)
//   ?vibe=cozy,minimal          (any-of, must have at least one)
//   ?q=grandview                (name/neighborhood text search)
// Each café comes back with its vibes[] and live avg_rating/review_count.
export async function listCafes(req, res, next) {
  try {
    const clauses = [];
    const params = [];
    let i = 1;

    // Enum any-of filters — safe because values are bound, not interpolated.
    for (const col of ['wifi', 'noise', 'outlets']) {
      const raw = req.query[col];
      if (raw) {
        const values = raw.split(',').map((v) => v.trim()).filter(Boolean);
        if (values.length) {
          clauses.push(`c.${col} = ANY($${i}::text[]::${enumType(col)}[])`);
          params.push(values);
          i++;
        }
      }
    }

    // Free-text on name / neighborhood.
    if (req.query.q) {
      clauses.push(`(c.name ILIKE $${i} OR c.neighborhood ILIKE $${i})`);
      params.push(`%${req.query.q}%`);
      i++;
    }

    // Vibe filter: café must have at least one of the requested vibes.
    let vibeJoin = '';
    if (req.query.vibe) {
      const vibes = req.query.vibe.split(',').map((v) => v.trim()).filter(Boolean);
      if (vibes.length) {
        vibeJoin = `
          JOIN cafe_vibes cv_f ON cv_f.cafe_id = c.id
          JOIN vibes v_f       ON v_f.id = cv_f.vibe_id AND v_f.label = ANY($${i}::text[])
        `;
        params.push(vibes);
        i++;
      }
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `
      SELECT c.id, c.name, c.neighborhood, c.lat, c.lng,
             c.wifi, c.noise, c.outlets, c.blurb,
             COALESCE(cr.avg_rating, 0)   AS avg_rating,
             COALESCE(cr.review_count, 0) AS review_count,
             COALESCE(
               ARRAY_AGG(DISTINCT v.label) FILTER (WHERE v.label IS NOT NULL),
               '{}'
             ) AS vibes
      FROM cafes c
      ${vibeJoin}
      LEFT JOIN cafe_vibes cv ON cv.cafe_id = c.id
      LEFT JOIN vibes v       ON v.id = cv.vibe_id
      LEFT JOIN cafe_ratings cr ON cr.cafe_id = c.id
      ${where}
      GROUP BY c.id, cr.avg_rating, cr.review_count
      ORDER BY cr.avg_rating DESC NULLS LAST, c.name ASC;
    `;

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/cafes/:id  — one café with vibes + full review list
export async function getCafe(req, res, next) {
  try {
    const { id } = req.params;

    const cafeSql = `
      SELECT c.id, c.name, c.neighborhood, c.lat, c.lng,
             c.wifi, c.noise, c.outlets, c.blurb,
             COALESCE(cr.avg_rating, 0)   AS avg_rating,
             COALESCE(cr.review_count, 0) AS review_count,
             COALESCE(
               ARRAY_AGG(DISTINCT v.label) FILTER (WHERE v.label IS NOT NULL),
               '{}'
             ) AS vibes
      FROM cafes c
      LEFT JOIN cafe_vibes cv ON cv.cafe_id = c.id
      LEFT JOIN vibes v       ON v.id = cv.vibe_id
      LEFT JOIN cafe_ratings cr ON cr.cafe_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, cr.avg_rating, cr.review_count;
    `;
    const { rows } = await query(cafeSql, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Café not found' });

    const reviews = await query(
      `SELECT id, author, rating, body, created_at
       FROM reviews WHERE cafe_id = $1
       ORDER BY created_at DESC;`,
      [id]
    );

    res.json({ ...rows[0], reviews: reviews.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/cafes/:id/reviews  — { author?, rating, body }
export async function addReview(req, res, next) {
  try {
    const { id } = req.params;
    const { author, rating, body } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be 1–5' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'body is required' });
    }

    const exists = await query('SELECT 1 FROM cafes WHERE id = $1', [id]);
    if (!exists.rows.length) return res.status(404).json({ error: 'Café not found' });

    const { rows } = await query(
      `INSERT INTO reviews (cafe_id, author, rating, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, author, rating, body, created_at;`,
      [id, author?.trim() || 'Anonymous', rating, body.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Map filter param -> Postgres enum type name.
function enumType(col) {
  return {
    wifi: 'wifi_quality',
    noise: 'noise_level',
    outlets: 'outlet_availability',
  }[col];
}
