// Yarn compatibility scoring.
//
// Given the yarn you're using (the "target") and a candidate, produce a 0–100 score
// with a per-factor breakdown a knitter can read. Two modes:
//
//   substitute – the candidate replaces your yarn for the whole garment.
//   mix        – both yarns go into the SAME garment (stripes, colorwork, a contrast
//                yoke). Care is "strictest wins", so a candidate that can't survive
//                your yarn's wash routine is a hard conflict, and gauge/grist matter
//                more because the two fabrics sit side by side.
//
// Everything here is a pure function over rows shaped like the `yarn_summary`
// view, so it is unit tested without a database.

export const MODES = ['mix', 'substitute'];

// Ordered from least to most restrictive.
export const WASH_ORDER = ['machine_warm', 'machine_cold', 'hand_wash', 'dry_clean'];
export const DRY_ORDER = ['tumble_normal', 'tumble_low', 'line_dry', 'lay_flat'];

export const CARE_LABELS = {
  machine_warm: 'machine wash warm',
  machine_cold: 'machine wash cool',
  hand_wash: 'hand wash',
  dry_clean: 'dry clean',
  tumble_normal: 'tumble dry',
  tumble_low: 'tumble dry low',
  line_dry: 'line dry',
  lay_flat: 'dry flat',
};

export const MAX_POINTS = { gauge: 30, care: 25, fiber: 20, grist: 15, construction: 10 };

const CATEGORIES = ['animal', 'plant', 'synthetic', 'regenerated'];

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function status(points, max) {
  const ratio = max ? points / max : 0;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.5) return 'fair';
  return 'poor';
}

function factor(key, label, points, note) {
  const max = MAX_POINTS[key];
  const p = round1(Math.min(max, Math.max(0, points)));
  return { key, label, points: p, max, status: status(p, max), note };
}

/** The care a garment made from both yarns must follow: the stricter of each. */
export function garmentCare(a, b) {
  const wash = WASH_ORDER[Math.max(WASH_ORDER.indexOf(a.wash_method), WASH_ORDER.indexOf(b.wash_method))];
  const dry = DRY_ORDER[Math.max(DRY_ORDER.indexOf(a.dry_method), DRY_ORDER.indexOf(b.dry_method))];
  return { wash_method: wash, dry_method: dry };
}

/** Percent-weighted fiber properties for a blend. */
export function blendProfile(fibers = []) {
  const total = fibers.reduce((s, f) => s + f.percent, 0) || 1;
  const profile = { felts: 0, elasticity: 0, warmth: 0, categories: {} };
  for (const c of CATEGORIES) profile.categories[c] = 0;
  for (const f of fibers) {
    const w = f.percent / total;
    if (f.felts) profile.felts += w;
    profile.elasticity += f.elasticity * w;
    profile.warmth += f.warmth * w;
    profile.categories[f.category] = (profile.categories[f.category] || 0) + w;
  }
  return profile;
}

function feltingFibers(yarn) {
  return (yarn.fibers || []).filter((f) => f.felts);
}

function gaugeMid(y) {
  return (Number(y.gauge_min) + Number(y.gauge_max)) / 2;
}

export function scoreGauge(target, cand, mode) {
  const diff = gaugeMid(cand) - gaugeMid(target); // + means more (smaller) stitches
  const d = Math.abs(diff);
  const span = mode === 'mix' ? 2.5 : 3.5;
  const points = MAX_POINTS.gauge * clamp01(1 - d / span);
  let note;
  if (d < 0.25) {
    note = `Same gauge (${fmt(gaugeMid(cand))} sts / 4").`;
  } else {
    const pct = Math.round((d / gaugeMid(target)) * 100);
    note =
      diff > 0
        ? `${fmt(d)} more sts / 4" (about ${pct}% finer) — try a larger needle to match.`
        : `${fmt(d)} fewer sts / 4" (about ${pct}% heavier) — try a smaller needle to match.`;
  }
  return factor('gauge', 'Gauge', points, note);
}

export function scoreCare(target, cand, mode) {
  const washDiff = WASH_ORDER.indexOf(cand.wash_method) - WASH_ORDER.indexOf(target.wash_method);
  const dryDiff = DRY_ORDER.indexOf(cand.dry_method) - DRY_ORDER.indexOf(target.dry_method);
  const candCare = `${CARE_LABELS[cand.wash_method]}, ${CARE_LABELS[cand.dry_method]}`;
  const conflicts = [];

  if (washDiff <= 0 && dryDiff <= 0) {
    const same = washDiff === 0 && dryDiff === 0;
    return {
      factor: factor(
        'care',
        'Care',
        MAX_POINTS.care,
        same ? `Same care (${candCare}).` : `Easier care (${candCare}) — follow your yarn's label.`,
      ),
      conflicts,
    };
  }

  if (mode === 'substitute') {
    const points = MAX_POINTS.care - 7 * Math.max(0, washDiff) - 4 * Math.max(0, dryDiff);
    return {
      factor: factor('care', 'Care', points, `Fussier care: ${candCare}.`),
      conflicts,
    };
  }

  // mix mode — the garment must follow the stricter routine.
  if (washDiff > 0) {
    const felting = feltingFibers(cand);
    if (felting.length && ['machine_warm', 'machine_cold'].includes(target.wash_method)) {
      const pct = felting.reduce((s, f) => s + f.percent, 0);
      const names = felting.map((f) => f.name.toLowerCase()).join(' / ');
      conflicts.push(
        `Contains ${pct}% non-superwash ${names}: it will felt and shrink if the sweater is machine-washed like your yarn.`,
      );
    } else {
      conflicts.push(`Needs ${CARE_LABELS[cand.wash_method]} — the whole sweater would lose machine-washability.`);
    }
    return { factor: factor('care', 'Care', 0, `Stricter care: ${candCare}.`), conflicts };
  }

  // Only drying is stricter: not damaging, but the whole garment must be dried that way.
  const points = MAX_POINTS.care - 5 * dryDiff;
  return {
    factor: factor(
      'care',
      'Care',
      points,
      `Washes the same, but the whole sweater would need to ${CARE_LABELS[cand.dry_method]}.`,
    ),
    conflicts,
  };
}

export function scoreFiber(target, cand, mode) {
  const a = blendProfile(target.fibers);
  const b = blendProfile(cand.fibers);
  const feltDiff = Math.abs(a.felts - b.felts);
  const elastDiff = Math.abs(a.elasticity - b.elasticity) / 4;
  const warmthDiff = Math.abs(a.warmth - b.warmth) / 4;
  const catDist = 0.5 * CATEGORIES.reduce((s, c) => s + Math.abs(a.categories[c] - b.categories[c]), 0);
  const similarity = 1 - (0.3 * feltDiff + 0.15 * elastDiff + 0.4 * catDist + 0.15 * warmthDiff);
  const points = MAX_POINTS.fiber * clamp01(similarity);

  let note;
  if (catDist > 0.5) {
    note = `Very different fiber (${cand.blend}) — it will drape, stretch and recover differently.`;
  } else if (mode === 'mix' && feltDiff >= 0.25) {
    note = `${cand.blend}: one yarn can felt and the other can't, so they'll react differently to washing.`;
  } else if (similarity >= 0.85) {
    note = `Similar fiber behavior (${cand.blend}).`;
  } else {
    note = `Somewhat different blend (${cand.blend}) — swatch and wash them together first.`;
  }
  return { ...factor('fiber', 'Fiber', points, note), differentFamily: catDist > 0.5 };
}

export function scoreGrist(target, cand, mode) {
  const ta = Number(target.yards_per_gram);
  const ca = Number(cand.yards_per_gram);
  const ratio = Math.min(ta, ca) / Math.max(ta, ca);
  const floor = mode === 'mix' ? 0.75 : 0.6;
  const points = MAX_POINTS.grist * clamp01((ratio - floor) / (1 - floor));
  const pct = Math.round(Math.abs(ca / ta - 1) * 100);
  let note;
  if (pct <= 5) note = `Similar density (${ca.toFixed(2)} yds/g).`;
  else if (ca < ta)
    note = `${pct}% heavier per yard (${ca.toFixed(2)} vs ${ta.toFixed(2)} yds/g)${mode === 'mix' ? ' — can weigh down the lighter yarn' : ''}.`;
  else note = `${pct}% lighter per yard (${ca.toFixed(2)} vs ${ta.toFixed(2)} yds/g) — airier fabric.`;
  return factor('grist', 'Density', points, note);
}

const CONSTRUCTION_GROUP = { plied: 'smooth', single: 'smooth', chainette: 'lofty', brushed: 'lofty', tape: 'tape' };

export function scoreConstruction(target, cand) {
  if (target.construction === cand.construction) {
    return factor('construction', 'Construction', MAX_POINTS.construction, `Both ${cand.construction}.`);
  }
  const sameGroup = CONSTRUCTION_GROUP[target.construction] === CONSTRUCTION_GROUP[cand.construction];
  return factor(
    'construction',
    'Construction',
    sameGroup ? 6 : 3,
    `${cand.construction} vs ${target.construction} — stitch definition and pilling will differ.`,
  );
}

function verdictFor(score, conflicts) {
  if (conflicts.length) return 'conflict';
  if (score >= 80) return 'great';
  if (score >= 60) return 'good';
  if (score >= 40) return 'possible';
  return 'poor';
}

/** Score one candidate against the target yarn. */
export function scoreMatch(target, cand, mode = 'mix') {
  if (!MODES.includes(mode)) throw new Error(`Unknown mode: ${mode}`);
  const care = scoreCare(target, cand, mode);
  const factors = [
    scoreGauge(target, cand, mode),
    care.factor,
    scoreFiber(target, cand, mode),
    scoreGrist(target, cand, mode),
    scoreConstruction(target, cand),
  ];
  let score = Math.round(factors.reduce((s, f) => s + f.points, 0));
  // A completely different fiber family (wool vs cotton/acrylic) stretches, recovers
  // and drapes differently no matter how well the other numbers line up, so it can't
  // be a "great" match — and in one garment it's at best "possible".
  if (factors[2].differentFamily) score = Math.min(score, mode === 'mix' ? 59 : 79);
  if (care.conflicts.length) score = Math.min(score, 40);
  return {
    yarn: cand,
    score,
    verdict: verdictFor(score, care.conflicts),
    factors,
    conflicts: care.conflicts,
    garmentCare: mode === 'mix' ? garmentCare(target, cand) : null,
  };
}

/** Score and rank candidates (best first). */
export function rankMatches(target, candidates, mode = 'mix', limit = 25) {
  return candidates
    .filter((c) => c.id !== target.id)
    .map((c) => scoreMatch(target, c, mode))
    .sort((a, b) => b.score - a.score || a.yarn.full_name.localeCompare(b.yarn.full_name))
    .slice(0, limit);
}
