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

  // Vendors are public but validate their query - 400 proves the mount is live.
  const nearby = await request(app).get('/api/vendors/nearby');
  assert.strictEqual(nearby.status, 400, `vendors/nearby should be mounted, got ${nearby.status}`);

  const route = await request(app).get('/api/vendors/route');
  assert.strictEqual(route.status, 400, `vendors/route should be mounted, got ${route.status}`);

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
