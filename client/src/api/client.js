// Thin fetch wrapper. In dev, Vite proxies /api to Express; in a split deployment
// set VITE_API_URL to the API's origin.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  const res = await fetch(`${BASE}/api${path}${qs ? `?${qs}` : ''}`);
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body;
}

export const api = {
  searchYarns: (q, weight) => get('/yarns', { q, weight }),
  getYarn: (id) => get(`/yarns/${id}`),
  getMatches: (id, { mode, tolerance }) => get(`/yarns/${id}/matches`, { mode, tolerance }),
  weights: () => get('/weights'),
};
