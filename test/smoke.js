// Smoke test — run the server (npm run dev) in one terminal, then:
//   node test/smoke.js
// Exercises every endpoint and checks the relational bits actually joined.
// No test framework; just fetch + asserts so there's nothing to install.

const BASE = process.env.BASE || 'http://localhost:3000';
let pass = 0, fail = 0;

function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else      { fail++; console.log(`  ✗ ${label}`); }
}

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function post(path, data) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function run() {
  console.log(`\nCafé Compass smoke test → ${BASE}\n`);

  // health
  console.log('health');
  const h = await get('/health');
  ok(h.status === 200 && h.body?.ok === true, 'GET /health');

  // list all
  console.log('\ncafés — list');
  const all = await get('/api/cafes');
  ok(all.status === 200, 'GET /api/cafes → 200');
  ok(Array.isArray(all.body) && all.body.length === 12, 'returns 12 seeded cafés');
  const sample = all.body?.[0];
  ok(Array.isArray(sample?.vibes), 'each café has a vibes[] array (join worked)');
  ok('avg_rating' in (sample || {}), 'each café has avg_rating (view joined)');
  ok(
    all.body?.every((c, i, a) => i === 0 || Number(a[i - 1].avg_rating) >= Number(c.avg_rating)),
    'sorted by avg_rating desc'
  );

  // enum filter (any-of)
  console.log('\ncafés — enum filters');
  const strong = await get('/api/cafes?wifi=strong,blazing');
  ok(strong.status === 200, 'GET ?wifi=strong,blazing → 200');
  ok(strong.body?.every((c) => ['strong', 'blazing'].includes(c.wifi)), 'all results match wifi filter');

  const quiet = await get('/api/cafes?noise=silent,quiet&outlets=plenty');
  ok(quiet.status === 200, 'GET ?noise=...&outlets=plenty → 200 (AND-combined)');
  ok(
    quiet.body?.every((c) => ['silent', 'quiet'].includes(c.noise) && c.outlets === 'plenty'),
    'results satisfy BOTH filters'
  );

  // vibe filter (any-of via join)
  console.log('\ncafés — vibe filter');
  const cozy = await get('/api/cafes?vibe=cozy');
  ok(cozy.status === 200, 'GET ?vibe=cozy → 200');
  ok(cozy.body?.every((c) => c.vibes.includes('cozy')), 'every result actually has the cozy vibe');
  ok(cozy.body?.length < 12, 'vibe filter narrows the set (no row duplication)');

  // text search
  console.log('\ncafés — text search');
  const gv = await get('/api/cafes?q=grandview');
  ok(gv.status === 200, 'GET ?q=grandview → 200');
  ok(gv.body?.every((c) => /grandview/i.test(c.neighborhood + c.name)), 'q matches name/neighborhood');

  // single café + reviews
  console.log('\ncafé — detail');
  const one = await get('/api/cafes/1');
  ok(one.status === 200, 'GET /api/cafes/1 → 200');
  ok(Array.isArray(one.body?.reviews), 'café detail includes reviews[]');
  ok(Array.isArray(one.body?.vibes), 'café detail includes vibes[]');
  const missing = await get('/api/cafes/99999');
  ok(missing.status === 404, 'GET /api/cafes/99999 → 404');

  // add review (mutation) + verify avg moved
  console.log('\nreviews — create + aggregate');
  const before = await get('/api/cafes/1');
  const beforeCount = before.body?.review_count ?? 0;
  const created = await post('/api/cafes/1/reviews', { author: 'SmokeTest', rating: 5, body: 'Testing the review path.' });
  ok(created.status === 201, 'POST review → 201');
  ok(created.body?.id != null, 'returns new review id');
  const after = await get('/api/cafes/1');
  ok(Number(after.body?.review_count) === Number(beforeCount) + 1, 'review_count incremented (view is live)');

  // validation
  console.log('\nreviews — validation');
  const badRating = await post('/api/cafes/1/reviews', { rating: 9, body: 'nope' });
  ok(badRating.status === 400, 'rating out of range → 400');
  const noBody = await post('/api/cafes/1/reviews', { rating: 4 });
  ok(noBody.status === 400, 'missing body → 400');

  // collections
  console.log('\ncollections');
  const cols = await get('/api/collections');
  ok(cols.status === 200, 'GET /api/collections → 200');
  ok(cols.body?.every((c) => 'cafe_count' in c), 'each collection has cafe_count');
  const col1 = await get('/api/collections/1');
  ok(col1.status === 200 && Array.isArray(col1.body?.cafes), 'GET /api/collections/1 includes cafes[]');

  // vibes metadata
  console.log('\nvibes');
  const vibes = await get('/api/vibes');
  ok(vibes.status === 200 && vibes.body?.length === 8, 'GET /api/vibes → 8 vibes');

  console.log(`\n────────────\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
