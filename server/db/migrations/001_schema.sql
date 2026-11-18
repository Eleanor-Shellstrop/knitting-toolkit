-- Knitting Toolkit schema
-- Care instructions are stored as normalized enums (CHECK constraints) rather than
-- free text so the matching service can compare them, order them by strictness,
-- and compute the "strictest wins" care for a garment that mixes yarns.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE brands (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Craft Yarn Council standard weight categories (0 = lace ... 7 = jumbo).
CREATE TABLE yarn_weights (
  id                       SERIAL PRIMARY KEY,
  sort_order               SMALLINT NOT NULL UNIQUE CHECK (sort_order BETWEEN 0 AND 7),
  name                     TEXT NOT NULL UNIQUE,
  common_names             TEXT NOT NULL,
  typical_sts_per_4in_min  REAL NOT NULL,
  typical_sts_per_4in_max  REAL NOT NULL,
  CHECK (typical_sts_per_4in_min <= typical_sts_per_4in_max)
);

CREATE TABLE fibers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL CHECK (category IN ('animal', 'plant', 'synthetic', 'regenerated')),
  felts       BOOLEAN NOT NULL,              -- will it felt/shrink with agitation + heat?
  elasticity  SMALLINT NOT NULL CHECK (elasticity BETWEEN 1 AND 5),
  warmth      SMALLINT NOT NULL CHECK (warmth BETWEEN 1 AND 5)
);

CREATE TABLE yarns (
  id                     SERIAL PRIMARY KEY,
  brand_id               INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  weight_id              INTEGER NOT NULL REFERENCES yarn_weights(id),
  gauge_sts_per_4in_min  REAL NOT NULL CHECK (gauge_sts_per_4in_min > 0),
  gauge_sts_per_4in_max  REAL NOT NULL,
  needle_mm_min          REAL NOT NULL CHECK (needle_mm_min > 0),
  needle_mm_max          REAL NOT NULL,
  yards_per_skein        INTEGER NOT NULL CHECK (yards_per_skein > 0),
  grams_per_skein        INTEGER NOT NULL CHECK (grams_per_skein > 0),
  construction           TEXT NOT NULL CHECK (construction IN ('plied', 'single', 'chainette', 'brushed', 'tape')),
  wash_method            TEXT NOT NULL CHECK (wash_method IN ('machine_warm', 'machine_cold', 'hand_wash', 'dry_clean')),
  dry_method             TEXT NOT NULL CHECK (dry_method IN ('tumble_normal', 'tumble_low', 'line_dry', 'lay_flat')),
  discontinued           BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (brand_id, name),
  CHECK (gauge_sts_per_4in_min <= gauge_sts_per_4in_max),
  CHECK (needle_mm_min <= needle_mm_max)
);

CREATE TABLE yarn_fibers (
  yarn_id   INTEGER NOT NULL REFERENCES yarns(id) ON DELETE CASCADE,
  fiber_id  INTEGER NOT NULL REFERENCES fibers(id),
  percent   SMALLINT NOT NULL CHECK (percent BETWEEN 1 AND 100),
  PRIMARY KEY (yarn_id, fiber_id)
);

CREATE INDEX yarns_weight_idx ON yarns (weight_id);
CREATE INDEX yarns_name_trgm_idx ON yarns USING gin (name gin_trgm_ops);
CREATE INDEX brands_name_trgm_idx ON brands USING gin (name gin_trgm_ops);

-- One denormalized row per yarn, ready for the API: brand + weight joined in,
-- grist (yards per gram) derived, and the fiber blend aggregated both as a
-- human-readable label and as JSON for the scoring service.
CREATE VIEW yarn_summary AS
SELECT
  y.id,
  b.name                                   AS brand,
  y.name,
  b.name || ' ' || y.name                  AS full_name,
  w.name                                   AS weight_name,
  w.common_names                           AS weight_common_names,
  w.sort_order                             AS weight_order,
  y.gauge_sts_per_4in_min                  AS gauge_min,
  y.gauge_sts_per_4in_max                  AS gauge_max,
  y.needle_mm_min,
  y.needle_mm_max,
  y.yards_per_skein,
  y.grams_per_skein,
  y.yards_per_skein::float8 / y.grams_per_skein AS yards_per_gram,
  y.construction,
  y.wash_method,
  y.dry_method,
  y.discontinued,
  COALESCE(fb.blend, '')                   AS blend,
  COALESCE(fb.fibers, '[]'::json)          AS fibers
FROM yarns y
JOIN brands b       ON b.id = y.brand_id
JOIN yarn_weights w ON w.id = y.weight_id
LEFT JOIN LATERAL (
  SELECT
    string_agg(yf.percent || '% ' || f.name, ', ' ORDER BY yf.percent DESC, f.name) AS blend,
    json_agg(json_build_object(
      'name', f.name,
      'category', f.category,
      'felts', f.felts,
      'elasticity', f.elasticity,
      'warmth', f.warmth,
      'percent', yf.percent
    ) ORDER BY yf.percent DESC, f.name) AS fibers
  FROM yarn_fibers yf
  JOIN fibers f ON f.id = yf.fiber_id
  WHERE yf.yarn_id = y.id
) fb ON TRUE;
