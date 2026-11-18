// Gauge & size math. Pure functions, no Vue — unit tested in gauge.test.js.
//
// The core idea: a pattern's stitch counts are fixed, so if your stitches are a
// different size than the designer's, every width scales by
//
//     factor = patternStsPerSpan / yourStsPerSpan
//
// e.g. pattern 20 sts / 4", you 22 sts / 4" → factor 0.909: each size comes out
// ~9% smaller. Knitting a larger size can compensate — but only up to a point,
// because armhole depth, neck and sleeve shaping belong to that other size.

import { GAUGE_SPAN } from './units.js';

const isPos = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;

export function scaleFactor(patternSts, yourSts) {
  if (!isPos(patternSts) || !isPos(yourSts)) throw new RangeError('Gauges must be positive numbers');
  return patternSts / yourSts;
}

/** Stitches needed to span a measurement at a given gauge. */
export function stitchesFor(measurement, stsPerSpan, span = GAUGE_SPAN.in) {
  return (measurement * stsPerSpan) / span;
}

/** Measurement produced by a stitch count at a given gauge. */
export function measurementFor(stitches, stsPerSpan, span = GAUGE_SPAN.in) {
  return (stitches * span) / stsPerSpan;
}

/**
 * Convert a pattern stitch/row count to the count that gives the SAME physical
 * size at your gauge. (Pattern: 44 sts at 20/4"; you at 22/4" → 48.4 sts.)
 */
export function convertCount(count, patternGauge, yourGauge) {
  return (count * yourGauge) / patternGauge;
}

/**
 * Round a stitch count to fit a stitch-pattern repeat: n = k × multiple + extra.
 * e.g. a 2x2 rib in the round wants a multiple of 4; flat it might be 4 + 2.
 */
export function roundToMultiple(n, multiple = 1, extra = 0) {
  const m = Math.max(1, Math.round(multiple || 1));
  const e = Math.max(0, Math.round(extra || 0));
  const k = Math.max(1, Math.round((n - e) / m));
  return k * m + e;
}

/** Index of the value closest to target; ties go to the larger value (positive ease is safer). */
export function closestIndex(values, target) {
  let best = -1;
  values.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    if (best === -1) return void (best = i);
    const d = Math.abs(v - target);
    const bd = Math.abs(values[best] - target);
    if (d < bd - 1e-9 || (Math.abs(d - bd) < 1e-9 && v > values[best])) best = i;
  });
  return best === -1 ? null : best;
}

const pct = (f) => Math.round(Math.abs(f - 1) * 100);

/**
 * Evaluate every size of a pattern at your gauge and recommend what to do.
 *
 * @param {object} input
 * @param {{name:string, chest:number}[]} input.sizes  pattern's finished chest per size
 * @param {{sts:number, rows?:number}} input.pattern   pattern gauge (per span)
 * @param {{sts:number, rows?:number}} input.yours     your swatch gauge (per span)
 * @param {number} input.targetChest                   finished chest you want
 * @param {number} [input.tolerance=1]                 acceptable ± difference
 * @param {number} [input.stitchMultiple=1]            stitch-pattern repeat for custom cast-on
 * @param {number} [input.edgeStitches=0]              extra sts outside the repeat
 * @param {'in'|'cm'} [input.unit='in']
 */
export function evaluateSizes(input) {
  const {
    sizes = [],
    pattern = {},
    yours = {},
    targetChest,
    tolerance = 1,
    stitchMultiple = 1,
    edgeStitches = 0,
    unit = 'in',
  } = input;
  const span = GAUGE_SPAN[unit] ?? GAUGE_SPAN.in;
  const validSizes = sizes.filter((s) => isPos(s.chest));

  if (!isPos(pattern.sts) || !isPos(yours.sts) || !isPos(targetChest) || validSizes.length === 0) {
    return { verdict: 'incomplete', headline: 'Enter both gauges, a target chest and at least one size', warnings: [] };
  }

  const factor = scaleFactor(pattern.sts, yours.sts);
  const rowFactor = isPos(pattern.rows) && isPos(yours.rows) ? pattern.rows / yours.rows : null;

  const rows = validSizes.map((s) => {
    const actualChest = s.chest * factor;
    const diff = actualChest - targetChest;
    return { name: s.name || '?', chest: s.chest, actualChest, diff, fits: Math.abs(diff) <= tolerance + 1e-9 };
  });

  const usualIndex = closestIndex(rows.map((r) => r.chest), targetChest);
  const recommendedIndex = closestIndex(rows.map((r) => r.actualChest), targetChest);
  const rec = rows[recommendedIndex];
  const usual = rows[usualIndex];
  const sizeJump = Math.abs(recommendedIndex - usualIndex);
  const rowsMatch = rowFactor === null || Math.abs(rowFactor - 1) < 0.03;

  const rawStitches = stitchesFor(targetChest, yours.sts, span);
  const castOn = roundToMultiple(rawStitches, stitchMultiple, edgeStitches);
  const custom = {
    rawStitches,
    castOn,
    actualChest: measurementFor(castOn, yours.sts, span),
    stitchMultiple,
    edgeStitches,
  };

  const warnings = [];
  const gaugeNote =
    Math.abs(factor - 1) < 0.005
      ? null
      : `Your stitches are ${pct(factor)}% ${factor < 1 ? 'smaller' : 'larger'} than the pattern's, so every width comes out ${pct(factor)}% ${factor < 1 ? 'narrower' : 'wider'}.`;
  if (gaugeNote) warnings.push({ level: 'info', text: gaugeNote });

  if (!rec.fits) {
    // No size works; size-jump advice would contradict the verdict.
  } else if (sizeJump === 1) {
    warnings.push({
      level: 'info',
      text: `You'd follow size ${rec.name} for width but you're really a ${usual.name}. Armhole depth, neck and sleeve shaping are written for ${rec.name} — compare its lengths to your measurements.`,
    });
  } else if (sizeJump === 2) {
    warnings.push({
      level: 'warn',
      text: `Size ${rec.name} is two sizes from ${usual.name}. Expect a deeper armhole, wider neck and longer yoke than you'd want — plan to adjust those sections.`,
    });
  } else if (sizeJump >= 3) {
    warnings.push({
      level: 'severe',
      text: `Size ${rec.name} is ${sizeJump} sizes away from ${usual.name}; the proportions (armhole, neck, sleeves) will be off too far to fix in passing.`,
    });
  }

  if (!rowsMatch) {
    const taller = rowFactor > 1;
    warnings.push({
      level: 'warn',
      text: `Your row gauge differs by ${pct(rowFactor)}%: anything worked over a set number of rows (raglan or yoke depth, short rows, cables) will be ${pct(rowFactor)}% ${taller ? 'longer' : 'shorter'}. Lengths given in ${unit === 'in' ? 'inches' : 'cm'} ("work until 14") are unaffected.`,
    });
  }

  let verdict;
  if (!rec.fits) {
    verdict = 'custom';
    warnings.unshift({
      level: 'severe',
      text: `No size lands within ±${tolerance}${unit === 'in' ? '"' : ' cm'} of your target. The closest is ${rec.name} at ${rec.actualChest.toFixed(1)}${unit === 'in' ? '"' : ' cm'}.`,
    });
  } else if (sizeJump >= 3) {
    verdict = 'custom';
  } else if (sizeJump === 0 && rowsMatch) {
    verdict = 'as-written';
  } else {
    verdict = 'watch';
  }

  const headline = {
    'as-written': `Knit size ${rec.name} as written`,
    watch: `Knit size ${rec.name} — watch these sections`,
    custom: 'Do the custom math',
  }[verdict];

  return {
    verdict,
    headline,
    factor,
    rowFactor,
    sizes: rows,
    usualIndex,
    recommendedIndex,
    sizeJump,
    warnings,
    custom,
  };
}
