const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../auth/auth.middleware');
const { canViewSchedule: canViewEvent } = require('../schedule/schedule.middleware');
const Schedule = require('../schedule/schedule.model');
const Incident = require('../incident/incident.model');
const Inventory = require('../inventory/inventory.model');
const Budget = require('../budget/budget.model');
const EventVendor = require('../procurement/procurement.model');
const LostItem = require('../lostfound/lostfound.model');

const countBy = (rows, key) =>
  rows.reduce((acc, r) => ((acc[r[key] ?? 'Other'] = (acc[r[key] ?? 'Other'] || 0) + 1), acc), {});
const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

/** Pure rollup of one event's records. Kept DB-free so it can be checked without Mongo. */
function summarize({ event, tasks, incidents, inventory, budget, vendors, lostItems }, now = Date.now()) {
  const done = tasks.filter((t) => t.status === 'Done').length;
  const overdue = tasks.filter((t) => t.status !== 'Done' && t.endsAt && new Date(t.endsAt) < now).length;

  const resolved = incidents.filter((i) => i.resolvedAt);
  const mttr = resolved.length
    ? Math.round(resolved.reduce((s, i) => s + (new Date(i.resolvedAt) - new Date(i.createdAt)), 0) / resolved.length / 60000)
    : null;

  const planned = sum(budget, 'planned');
  const actual = sum(budget, 'actual');
  const committed = sum(vendors.filter((v) => v.stage === 'Booked' || v.stage === 'Paid'), 'quoteAmount');

  return {
    event: { title: event.title, startsAt: event.startsAt, status: event.status, staff: event.staff.length, capacity: event.capacity ?? null },
    tasks: { total: tasks.length, done, overdue, completion: pct(done, tasks.length), byStatus: countBy(tasks, 'status'), unassigned: tasks.filter((t) => !t.owner).length },
    incidents: {
      total: incidents.length,
      open: incidents.length - resolved.length,
      critical: incidents.filter((i) => i.priority === 'Critical' && !i.resolvedAt).length,
      mttrMinutes: mttr,
      byPriority: countBy(incidents, 'priority'),
      byStatus: countBy(incidents, 'status'),
    },
    inventory: { items: inventory.length, units: sum(inventory, 'stock'), byStatus: countBy(inventory, 'status') },
    budget: { planned, actual, variance: planned - actual, used: pct(actual, planned), lines: budget.length },
    vendors: { total: vendors.length, committed, byStage: countBy(vendors, 'stage') },
    lostFound: { total: lostItems.length, claimed: lostItems.filter((i) => i.status === 'Claimed').length },
  };
}

router.get('/', authenticate, canViewEvent, async (req, res, next) => {
  try {
    const q = { event: req.event._id };
    const [tasks, incidents, inventory, budget, vendors, lostItems] = await Promise.all(
      [Schedule, Incident, Inventory, Budget, EventVendor, LostItem].map((M) => M.find(q).lean())
    );
    res.json(summarize({ event: req.event, tasks, incidents, inventory, budget, vendors, lostItems }));
  } catch (err) {
    next(err);
  }
});

module.exports = { router, summarize };
