// Run: node event/event.test.js
const assert = require('assert');
const Event = require('./event.model');

// pick() must drop unknown/injected fields (mass-assignment guard).
const FIELDS = ['title', 'description', 'location', 'startsAt', 'endsAt', 'capacity', 'status'];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const picked = pick({ title: 'A', _id: 'hack', createdAt: 0, description: undefined });
assert.deepStrictEqual(picked, { title: 'A' });

// endsAt before startsAt is invalid...
const bad = new Event({
  title: 'A',
  startsAt: new Date('2026-01-02'),
  endsAt: new Date('2026-01-01'),
});
assert.strictEqual(bad.validateSync().errors.endsAt.message, 'endsAt must be on or after startsAt');

// ...after is fine, and missing title is caught.
assert.strictEqual(
  new Event({ title: 'A', startsAt: new Date('2026-01-01'), endsAt: new Date('2026-01-02') })
    .validateSync(),
  undefined
);
assert.ok(new Event({ startsAt: new Date() }).validateSync().errors.title);

console.log('ok');
