import { describe, expect, it } from 'vitest';
import { blendProfile, garmentCare, rankMatches, scoreMatch } from './matchYarns.js';

const F = {
  swWool: { name: 'Superwash Wool', category: 'animal', felts: false, elasticity: 3, warmth: 4 },
  swMerino: { name: 'Superwash Merino', category: 'animal', felts: false, elasticity: 3, warmth: 4 },
  wool: { name: 'Wool', category: 'animal', felts: true, elasticity: 4, warmth: 4 },
  cotton: { name: 'Cotton', category: 'plant', felts: false, elasticity: 1, warmth: 1 },
  acrylic: { name: 'Acrylic', category: 'synthetic', felts: false, elasticity: 2, warmth: 3 },
  nylon: { name: 'Nylon', category: 'synthetic', felts: false, elasticity: 3, warmth: 2 },
};

let nextId = 1;
function yarn(full_name, opts) {
  const fibers = opts.fibers.map(([f, percent]) => ({ ...f, percent }));
  return {
    id: nextId++,
    full_name,
    weight_order: 3,
    construction: 'plied',
    wash_method: 'machine_cold',
    dry_method: 'tumble_low',
    blend: fibers.map((f) => `${f.percent}% ${f.name}`).join(', '),
    ...opts,
    fibers,
  };
}

// The example from the brief: 100% superwash wool, 22 sts / 4", wash cool, tumble low.
const cascade220SW = yarn('Cascade Yarns 220 Superwash', {
  gauge_min: 22, gauge_max: 22, yards_per_gram: 2.2, fibers: [[F.swWool, 100]],
});
const ultraWoolDK = yarn('Berroco Ultra Wool DK', {
  gauge_min: 22, gauge_max: 22, yards_per_gram: 2.92, fibers: [[F.swWool, 100]],
});
const cascadeSWMerino = yarn('Cascade Yarns 220 Superwash Merino', {
  gauge_min: 22, gauge_max: 22, yards_per_gram: 2.2, fibers: [[F.swMerino, 100]],
});
const arbor = yarn('Brooklyn Tweed Arbor', {
  gauge_min: 22, gauge_max: 24, yards_per_gram: 2.9, wash_method: 'hand_wash', dry_method: 'lay_flat',
  fibers: [[F.wool, 100]],
});
const ultraPima = yarn('Cascade Yarns Ultra Pima', {
  gauge_min: 22, gauge_max: 24, yards_per_gram: 2.2, dry_method: 'lay_flat', fibers: [[F.cotton, 100]],
});
const vintageDK = yarn('Berroco Vintage DK', {
  gauge_min: 22, gauge_max: 22, yards_per_gram: 2.88, fibers: [[F.acrylic, 52], [F.swWool, 40], [F.nylon, 8]],
});
const looseGauge = yarn('Hypothetical Heavy DK', {
  gauge_min: 20, gauge_max: 20, yards_per_gram: 2.2, fibers: [[F.swWool, 100]],
});

describe('blendProfile', () => {
  it('weights fiber properties by percentage', () => {
    const p = blendProfile(vintageDK.fibers);
    expect(p.categories.synthetic).toBeCloseTo(0.6);
    expect(p.categories.animal).toBeCloseTo(0.4);
    expect(p.felts).toBe(0);
  });
});

describe('garmentCare', () => {
  it('takes the strictest wash and dry of the two yarns', () => {
    expect(garmentCare(cascade220SW, arbor)).toEqual({ wash_method: 'hand_wash', dry_method: 'lay_flat' });
    expect(garmentCare(cascade220SW, ultraPima)).toEqual({ wash_method: 'machine_cold', dry_method: 'lay_flat' });
  });
});

describe('scoreMatch', () => {
  it('scores an identical-behaving yarn near 100', () => {
    const m = scoreMatch(cascade220SW, cascadeSWMerino, 'mix');
    expect(m.score).toBeGreaterThanOrEqual(95);
    expect(m.verdict).toBe('great');
    expect(m.conflicts).toEqual([]);
  });

  it('flags non-superwash wool as a felting conflict in mix mode', () => {
    const m = scoreMatch(cascade220SW, arbor, 'mix');
    expect(m.verdict).toBe('conflict');
    expect(m.score).toBeLessThanOrEqual(40);
    expect(m.conflicts[0]).toMatch(/felt/);
  });

  it('treats the same care difference as a penalty, not a conflict, when substituting', () => {
    const m = scoreMatch(cascade220SW, arbor, 'substitute');
    expect(m.conflicts).toEqual([]);
    expect(m.verdict).not.toBe('conflict');
    expect(m.factors.find((f) => f.key === 'care').points).toBeLessThan(25);
  });

  it('only warns (no conflict) when the candidate just needs drying flat', () => {
    const m = scoreMatch(cascade220SW, ultraPima, 'mix');
    expect(m.conflicts).toEqual([]);
    const care = m.factors.find((f) => f.key === 'care');
    expect(care.points).toBeGreaterThan(0);
    expect(care.points).toBeLessThan(25);
    expect(care.note).toMatch(/dry flat/);
  });

  it('penalizes very different fiber content and caps the verdict', () => {
    const mix = scoreMatch(cascade220SW, ultraPima, 'mix');
    expect(mix.factors.find((f) => f.key === 'fiber').status).toBe('poor');
    expect(mix.score).toBeLessThanOrEqual(59);
    expect(mix.verdict).toBe('possible');
    expect(scoreMatch(cascade220SW, ultraPima, 'substitute').verdict).not.toBe('great');
  });

  it('lowers the score as gauge drifts apart', () => {
    const same = scoreMatch(cascade220SW, cascadeSWMerino, 'mix');
    const loose = scoreMatch(cascade220SW, looseGauge, 'mix');
    expect(loose.score).toBeLessThan(same.score);
    const gauge = loose.factors.find((f) => f.key === 'gauge');
    expect(gauge.note).toMatch(/smaller needle/);
  });

  it('is stricter about gauge in mix mode than substitute mode', () => {
    const mix = scoreMatch(cascade220SW, looseGauge, 'mix').factors[0].points;
    const sub = scoreMatch(cascade220SW, looseGauge, 'substitute').factors[0].points;
    expect(mix).toBeLessThan(sub);
  });

  it('rejects unknown modes', () => {
    expect(() => scoreMatch(cascade220SW, arbor, 'blend')).toThrow();
  });
});

describe('rankMatches', () => {
  it('ranks other superwash wools above cotton and non-superwash wool for Cascade 220 Superwash', () => {
    const ranked = rankMatches(cascade220SW, [arbor, ultraPima, vintageDK, ultraWoolDK, cascadeSWMerino], 'mix');
    const names = ranked.map((m) => m.yarn.full_name);
    expect(names[0]).toBe('Cascade Yarns 220 Superwash Merino');
    expect(names.indexOf('Berroco Ultra Wool DK')).toBeLessThan(names.indexOf('Cascade Yarns Ultra Pima'));
    expect(names.at(-1)).toBe('Brooklyn Tweed Arbor');
  });

  it('never returns the target yarn itself', () => {
    const ranked = rankMatches(cascade220SW, [cascade220SW, arbor], 'mix');
    expect(ranked.map((m) => m.yarn.id)).not.toContain(cascade220SW.id);
  });
});
