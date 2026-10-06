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

  console.log('ok');
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
