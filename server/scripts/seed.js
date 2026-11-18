// Loads db/seed/seed.sql, then sanity-checks the data the schema can't enforce
// on its own (every yarn's fiber blend must add up to 100%).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'seed', 'seed.sql');

async function main() {
  const sql = await readFile(file, 'utf8');
  await pool.query(sql);

  const { rows: bad } = await pool.query(`
    SELECT ys.full_name, COALESCE(SUM(yf.percent), 0) AS total
    FROM yarn_summary ys
    LEFT JOIN yarn_fibers yf ON yf.yarn_id = ys.id
    GROUP BY ys.id, ys.full_name
    HAVING COALESCE(SUM(yf.percent), 0) <> 100`);
  if (bad.length) {
    throw new Error(
      'Fiber blends must total 100%:\n' + bad.map((r) => `  ${r.full_name}: ${r.total}%`).join('\n'),
    );
  }

  const { rows } = await pool.query(
    'SELECT (SELECT count(*) FROM yarns) AS yarns, (SELECT count(*) FROM brands) AS brands',
  );
  console.log(`Seeded ${rows[0].yarns} yarns from ${rows[0].brands} brands.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
