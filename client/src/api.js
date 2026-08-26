// Thin API layer. Uses VITE_API_BASE if set at build time, otherwise
// falls back to the deployed API URL. Local dev: set VITE_API_BASE="" to
// use the Vite proxy, or it'll hit the production API (also fine).
function apiBase() {
  const v = import.meta.env.VITE_API_BASE;
  if (v === '') return '';
  const base = v || 'https://cafe-compass-api.onrender.com';
  if (/^https?:\/\//.test(base)) return base;
  return `https://${base}`;
}
const BASE = apiBase() + '/api';

function buildCafeQuery(filters) {
  const params = new URLSearchParams();
  for (const key of ['wifi', 'noise', 'outlets']) {
    if (filters[key]?.length) params.set(key, filters[key].join(','));
  }
  if (filters.vibe?.length) params.set('vibe', filters.vibe.join(','));
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchCafes(filters) {
  const res = await fetch(`${BASE}/cafes${buildCafeQuery(filters)}`);
  if (!res.ok) throw new Error('Failed to load cafés');
  return res.json();
}

export async function fetchCafe(id) {
  const res = await fetch(`${BASE}/cafes/${id}`);
  if (!res.ok) throw new Error('Failed to load café');
  return res.json();
}

export async function fetchVibes() {
  const res = await fetch(`${BASE}/vibes`);
  if (!res.ok) throw new Error('Failed to load vibes');
  return res.json();
}

export async function postReview(cafeId, review) {
  const res = await fetch(`${BASE}/cafes/${cafeId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'Failed to post review');
  }
  return res.json();
}
