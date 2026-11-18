import { Router } from 'express';
import { query } from '../db/pool.js';

export const metaRouter = Router();

metaRouter.get('/weights', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT w.sort_order, w.name, w.common_names, w.typical_sts_per_4in_min, w.typical_sts_per_4in_max,
              count(y.id)::int AS yarn_count
       FROM yarn_weights w
       LEFT JOIN yarns y ON y.weight_id = w.id
       GROUP BY w.id
       ORDER BY w.sort_order`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

metaRouter.get('/fibers', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT f.name, f.category, f.felts, f.elasticity, f.warmth, count(yf.yarn_id)::int AS yarn_count
       FROM fibers f
       LEFT JOIN yarn_fibers yf ON yf.fiber_id = f.id
       GROUP BY f.id
       ORDER BY f.category, f.name`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
