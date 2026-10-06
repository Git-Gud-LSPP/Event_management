// Run: node api.routes.test.js
// Checks the wiring only - no database needed. Every case below answers before
// any query runs, so this fails loudly if a route stops being mounted or loses
// its auth guard.
const assert = require('assert');
const request = require('supertest');
const app = require('./app');

(async () => {
  // Endpoints that need a token must say 401, not 404 (404 = not mounted).
  for (const path of [
    '/api/auth/me',
    '/api/auth/users',
    '/api/events',
    '/api/events/507f1f77bcf86cd799439011/schedule',
    '/api/events/507f1f77bcf86cd799439011/floorplan',
    '/api/events/507f1f77bcf86cd799439011/analytics',
  ]) {
    const res = await request(app).get(path);
    assert.strictEqual(res.status, 401, `${path} should require a token, got ${res.status}`);
  }

  // Vendor search sits behind login and the vendors module now - 401 proves the guard is mounted.
  const nearby = await request(app).get('/api/vendors/nearby');
  assert.strictEqual(nearby.status, 401, `vendors/nearby should need a token, got ${nearby.status}`);

  const billing = await request(app).get('/api/billing/workspace');
  assert.strictEqual(billing.status, 401, `billing/workspace should need a token, got ${billing.status}`);

  const gen = await request(app).post('/api/events/000000000000000000000000/documents/generate');
  assert.strictEqual(gen.status, 401, `documents/generate should need a token, got ${gen.status}`);

  // Login still rejects an empty body rather than crashing.
  const login = await request(app).post('/api/auth/login').send({});
  assert.strictEqual(login.status, 400);

  // The 404 handler lives in app.js now, so it applies to the test app too.
  const missing = await request(app).get('/api/nope');
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.body.message, 'Not found');

  // Analytics rollup: pure function, no DB.
  const { summarize } = require('./analytics/analytics');
  const t0 = new Date('2026-01-01T10:00:00Z');
  const s = summarize({
    event: { title: 'X', startsAt: t0, status: 'published', staff: [1, 2] },
    tasks: [{ status: 'Done' }, { status: 'Pending', endsAt: t0, owner: 'u' }],
    incidents: [{ priority: 'Critical', createdAt: t0, resolvedAt: new Date(+t0 + 30 * 60000) }, { priority: 'Critical', createdAt: t0 }],
    inventory: [{ stock: 4, status: 'Available' }],
    budget: [{ planned: 100, actual: 150 }],
    vendors: [{ stage: 'Booked', quoteAmount: 50 }, { stage: 'Quoted', quoteAmount: 999 }],
    lostItems: [{ status: 'Claimed' }],
  }, +t0 + 3600000);
  assert.deepStrictEqual([s.tasks.completion, s.tasks.overdue, s.tasks.unassigned], [50, 1, 1]);
  assert.deepStrictEqual([s.incidents.open, s.incidents.critical, s.incidents.mttrMinutes], [1, 1, 30]);
  assert.deepStrictEqual([s.budget.variance, s.budget.used, s.vendors.committed], [-50, 150, 50]);

  console.log('ok');
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
