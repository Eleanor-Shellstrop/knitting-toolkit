import { describe, expect, it } from 'vitest';
import {
  closestIndex,
  convertCount,
  evaluateSizes,
  measurementFor,
  roundToMultiple,
  scaleFactor,
  stitchesFor,
} from './gauge.js';
import { convertGauge, convertLength, per10cmToPer4in, per4inToPer10cm } from './units.js';

const sizes = [
  { name: 'S', chest: 34 },
  { name: 'M', chest: 38 },
  { name: 'L', chest: 42 },
  { name: 'XL', chest: 46 },
];
const base = { sizes, pattern: { sts: 20, rows: 28 }, yours: { sts: 22, rows: 28 }, tolerance: 1 };

describe('basic gauge math', () => {
  it('computes the scale factor', () => {
    expect(scaleFactor(20, 22)).toBeCloseTo(0.909, 3);
    expect(scaleFactor(20, 20)).toBe(1);
    expect(() => scaleFactor(0, 20)).toThrow();
  });

  it('converts between stitches and measurements', () => {
    expect(stitchesFor(40, 22)).toBe(220);
    expect(measurementFor(220, 22)).toBe(40);
    expect(stitchesFor(100, 22, 10)).toBe(220); // metric: per 10 cm
  });

  it('converts a pattern count to your gauge', () => {
    expect(convertCount(44, 20, 22)).toBeCloseTo(48.4);
  });

  it('rounds to a stitch multiple plus edge stitches', () => {
    expect(roundToMultiple(221, 4)).toBe(220);
    expect(roundToMultiple(223, 4)).toBe(224);
    expect(roundToMultiple(220, 4, 2)).toBe(222);
    expect(roundToMultiple(220.4)).toBe(220);
    expect(roundToMultiple(1, 4)).toBe(4); // never zero repeats
  });

  it('picks the closest value, preferring the larger on a tie', () => {
    expect(closestIndex([30, 34, 38], 35)).toBe(1);
    expect(closestIndex([38, 42], 40)).toBe(1);
    expect(closestIndex([], 40)).toBe(null);
  });
});

describe('evaluateSizes', () => {
  it('says knit as written when gauge matches', () => {
    const r = evaluateSizes({ ...base, yours: { sts: 20, rows: 28 }, targetChest: 38 });
    expect(r.verdict).toBe('as-written');
    expect(r.headline).toBe('Knit size M as written');
    expect(r.factor).toBe(1);
  });

  it('recommends a larger size to compensate for tighter gauge', () => {
    // 42 × 20/22 = 38.2" — within ±1" of 38", one size up from M.
    const r = evaluateSizes({ ...base, targetChest: 38 });
    expect(r.verdict).toBe('watch');
    expect(r.sizes[r.recommendedIndex].name).toBe('L');
    expect(r.sizes[r.recommendedIndex].actualChest).toBeCloseTo(38.18, 2);
    expect(r.sizeJump).toBe(1);
  });

  it('falls back to custom math when no size lands within tolerance', () => {
    // Scaled sizes: 30.9 / 34.5 / 38.2 / 41.8 — nothing within ±1" of 40".
    const r = evaluateSizes({ ...base, targetChest: 40 });
    expect(r.verdict).toBe('custom');
    expect(r.headline).toBe('Do the custom math');
    expect(r.custom.castOn).toBe(220);
    expect(r.warnings[0].level).toBe('severe');
  });

  it('rounds the custom cast-on to the stitch multiple', () => {
    const r = evaluateSizes({ ...base, targetChest: 40.2, stitchMultiple: 4, edgeStitches: 2 });
    expect(r.custom.rawStitches).toBeCloseTo(221.1);
    expect((r.custom.castOn - 2) % 4).toBe(0);
    expect(r.custom.castOn).toBe(222);
    expect(r.custom.actualChest).toBeCloseTo((222 * 4) / 22);
  });

  it('warns about row gauge even when the width works', () => {
    const r = evaluateSizes({ ...base, yours: { sts: 20, rows: 32 }, targetChest: 38 });
    expect(r.verdict).toBe('watch');
    expect(r.rowFactor).toBeCloseTo(0.875);
    expect(r.warnings.some((w) => /row gauge/.test(w.text) && /shorter/.test(w.text))).toBe(true);
  });

  it('recommends custom math when the size jump is too big', () => {
    const many = [30, 32, 34, 36, 38, 40, 42, 44].map((c) => ({ name: String(c), chest: c }));
    // factor 20/24 = 0.833: the 44" size knits to 36.7" (fits a 37" target) but you're
    // really a 38" — three sizes away, so proportions would be badly off.
    const r = evaluateSizes({ ...base, sizes: many, yours: { sts: 24 }, targetChest: 37, tolerance: 1.5 });
    expect(r.sizes[r.recommendedIndex].name).toBe('44');
    expect(r.sizeJump).toBeGreaterThanOrEqual(3);
    expect(r.verdict).toBe('custom');
  });

  it('ignores blank sizes and reports incomplete input', () => {
    expect(evaluateSizes({ ...base, sizes: [{ name: 'S', chest: null }], targetChest: 38 }).verdict).toBe('incomplete');
    expect(evaluateSizes({ ...base, targetChest: undefined }).verdict).toBe('incomplete');
  });

  it('works in centimetres with gauge per 10 cm', () => {
    const cmSizes = sizes.map((s) => ({ ...s, chest: s.chest * 2.54 }));
    const r = evaluateSizes({
      sizes: cmSizes,
      pattern: { sts: per4inToPer10cm(20) },
      yours: { sts: per4inToPer10cm(22) },
      targetChest: 40 * 2.54,
      tolerance: 2.5,
      unit: 'cm',
    });
    expect(r.verdict).toBe('custom');
    expect(r.custom.castOn).toBe(220);
  });
});

describe('unit conversion', () => {
  it('round-trips lengths and gauges', () => {
    expect(convertLength(10, 'in', 'cm')).toBeCloseTo(25.4);
    expect(convertLength(25.4, 'cm', 'in')).toBeCloseTo(10);
    expect(per10cmToPer4in(per4inToPer10cm(22))).toBeCloseTo(22);
    expect(convertGauge(22, 'in', 'cm')).toBeCloseTo(21.65, 2);
    expect(convertGauge(22, 'in', 'in')).toBe(22);
  });
});
