import { Router } from 'express';
import { query } from '../db/pool.js';
import { MODES, rankMatches } from '../services/matchYarns.js';

export const yarnsRouter = Router();

const parseId = (raw) => {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/yarns?q=cascade&weight=3
// Fuzzy search on "brand name" using pg_trgm, with a substring fallback.
yarnsRouter.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim().slice(0, 100);
    const weight = req.query.weight === undefined ? null : Number.parseInt(req.query.weight, 10);
    const { rows } = await query(
      `SELECT *, CASE WHEN $1 = '' THEN 0 ELSE similarity(full_name, $1) END AS rank
       FROM yarn_summary
       WHERE ($1 = '' OR full_name ILIKE '%' || $1 || '%' OR similarity(full_name, $1) > 0.25)
         AND ($2::int IS NULL OR weight_order = $2::int)
       ORDER BY rank DESC, brand, name
       LIMIT 50`,
      [q, Number.isInteger(weight) ? weight : null],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/yarns/:id
yarnsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid yarn id' });
    const { rows } = await query('SELECT * FROM yarn_summary WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Yarn not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/yarns/:id/matches?mode=mix|substitute&tolerance=1
// SQL narrows to plausible candidates (adjacent weight class, overlapping gauge
// within the tolerance); the scoring service ranks them and explains why.
yarnsRouter.get('/:id/matches', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid yarn id' });
    const mode = String(req.query.mode ?? 'mix');
    if (!MODES.includes(mode)) return res.status(400).json({ error: `mode must be one of: ${MODES.join(', ')}` });
    const tolerance = Math.min(4, Math.max(0, Number(req.query.tolerance ?? 1) || 0));

    const { rows: targetRows } = await query('SELECT * FROM yarn_summary WHERE id = $1', [id]);
    if (!targetRows.length) return res.status(404).json({ error: 'Yarn not found' });
    const target = targetRows[0];

    const { rows: candidates } = await query(
      `SELECT c.*
       FROM yarn_summary c
       WHERE c.id <> $1
         AND NOT c.discontinued
         AND abs(c.weight_order - $2::int) <= 1
         AND c.gauge_min <= $4::real + $5::real
         AND c.gauge_max >= $3::real - $5::real`,
      [target.id, target.weight_order, target.gauge_min, target.gauge_max, tolerance],
    );

    res.json({ target, mode, tolerance, matches: rankMatches(target, candidates, mode) });
  } catch (err) {
    next(err);
  }
});
