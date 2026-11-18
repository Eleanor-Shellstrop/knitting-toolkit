# Knitting Toolkit

A full-stack web app that answers two questions every sweater knitter runs into:

1. **"My gauge doesn't match the pattern. Which size should I knit, or do I need to do the custom math?"**
2. **"Which yarns from other brands can I mix into the same sweater as the one I'm using?"**

Built with **Vue 3 + Pinia** on the front end, **Node/Express** for the API, and **PostgreSQL** for the yarn database.

---

## Features

### Gauge & Size Advisor
- Enter the pattern's gauge, your swatch gauge, your target finished chest and the pattern's size chart (inches or cm).
- Every size is rescaled to your gauge, and you get one of three verdicts:
  - **Knit size X as written**: your gauge matches and a size fits.
  - **Knit size X — watch these sections**: a different size fits the width, but the armhole, neck, sleeves or row-counted sections need attention.
  - **Do the custom math**: no size lands within your tolerance, or the size jump is too big. You get a custom cast-on rounded to your stitch-pattern repeat.
- A stitch and row converter turns any pattern count (cuff, upper arm, raglan depth) into the equivalent count at your gauge.
- Calculations can be saved to a local "stash", with no account needed.

### Yarn Match
- Fuzzy search across about 80 yarns from 22 brands (Postgres `pg_trgm`).
- Pick your yarn and get ranked candidates with a 0–100 score and a breakdown of each factor:

| Factor | Points | What it checks |
| --- | --- | --- |
| Gauge | 30 | Distance between gauge midpoints (stricter when mixing) |
| Care | 25 | The garment follows the strictest label. When mixing, a yarn that would **felt** in your yarn's wash routine is a hard conflict |
| Fiber | 20 | Felting, elasticity, warmth and fiber family, weighted by blend percentage |
| Density | 15 | Yards per gram (drape, and whether one yarn drags on another) |
| Construction | 10 | Plied / single / chainette |

- **Mix** mode (same garment) vs **Substitute** mode (full replacement) change how strict each factor is.
- Two caps override the total: a care conflict caps the score at 40, and a completely different fiber family (wool vs cotton or acrylic) caps it at 59 when mixing and at 79 when substituting.

## Architecture

```
client/  Vite + Vue 3 + Vue Router + Pinia (+ pinia-plugin-persistedstate)
  src/lib/gauge.js        pure gauge/size math (unit tested)
  src/lib/units.js        in/cm and per-4"/per-10cm conversion
  src/stores/             gaugeStore, yarnStore, stashStore
  src/views/, components/ UI
server/  Express + node-postgres
  src/routes/yarns.js     GET /api/yarns?q=  /api/yarns/:id  /api/yarns/:id/matches?mode=&tolerance=
  src/routes/meta.js      GET /api/weights  /api/fibers
  src/services/matchYarns.js   compatibility scoring (pure functions, unit tested)
  db/migrations/          SQL schema (tracked in schema_migrations)
  db/seed/seed.sql        curated yarn data
```

### Database schema

```
brands ─┐                  ┌─ yarn_weights (CYC 0–7)
        └── yarns ─────────┘
              │  wash_method / dry_method: CHECK-constrained enums
              │
         yarn_fibers (percent) ── fibers (category, felts, elasticity, warmth)

yarn_summary (VIEW): one API-ready row per yarn: brand + weight joined,
                     yards_per_gram derived, blend aggregated with string_agg + json_agg
```

Care is stored as ordered enums instead of free text, so "strictest care wins" is just a `max()` over two positions.

## Running locally

Requirements: Node 20+ and Docker.

```bash
cp .env.example .env
npm install
npm run db:up        # Postgres 16 in Docker on port 5433
npm run db:reset     # migrate + seed
npm run dev          # API on :3001, web on :5173
```

Open http://localhost:5173.

### Tests

```bash
npm test
```

This runs Vitest for the gauge math (`client/src/lib/gauge.test.js`) and the matching algorithm (`server/src/services/matchYarns.test.js`).

### Production build

`npm run build` builds the client into `client/dist`. When that folder exists, `npm start` serves it from Express, so the app deploys as a single Node service with a `DATABASE_URL` pointing at any hosted Postgres.

## A note on the data

The yarn specs come from typical manufacturer ball-band information and were entered by hand. Manufacturers change put-ups and care labels from time to time, so check the current label, and always swatch.
