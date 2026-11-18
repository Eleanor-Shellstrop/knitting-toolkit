// Unit helpers. Gauge is quoted per 4" in imperial patterns and per 10 cm in
// metric ones — those are NOT the same length (10 cm ≈ 3.94"), so converting a
// gauge between systems is a small scale, not a no-op.

export const CM_PER_IN = 2.54;

/** Length over which gauge is quoted, in the given unit system. */
export const GAUGE_SPAN = { in: 4, cm: 10 };

export const inToCm = (inches) => inches * CM_PER_IN;
export const cmToIn = (cm) => cm / CM_PER_IN;

export const per4inToPer10cm = (sts) => (sts * 10) / (4 * CM_PER_IN);
export const per10cmToPer4in = (sts) => (sts * 4 * CM_PER_IN) / 10;

/** Convert a length between 'in' and 'cm'. */
export function convertLength(value, from, to) {
  if (from === to || value == null || value === '') return value;
  return from === 'in' ? inToCm(value) : cmToIn(value);
}

/** Convert a stitches-or-rows-per-span gauge between 'in' (per 4") and 'cm' (per 10 cm). */
export function convertGauge(value, from, to) {
  if (from === to || value == null || value === '') return value;
  return from === 'in' ? per4inToPer10cm(value) : per10cmToPer4in(value);
}

export const round = (n, places = 1) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

export function formatLength(value, unit) {
  if (value == null || Number.isNaN(value)) return '—';
  const v = round(value, 1);
  return unit === 'in' ? `${v}"` : `${v} cm`;
}

export function gaugeLabel(unit) {
  return unit === 'in' ? 'per 4"' : 'per 10 cm';
}
