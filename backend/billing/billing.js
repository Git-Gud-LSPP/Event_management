const router = require('express').Router();
const User = require('../auth/user.model');
const Event = require('../event/event.model');
const { authenticate } = require('../auth/auth.middleware');

// Server copy of the workspace entitlements the frontend edits (frontend/src/billing/plan.ts).
// Backend routes for add-on modules check it, so a module switched off in the UI is off in the API too.
// ponytail: plan changes still come from the mock checkout with no payment behind them; verify the
// plan against Stripe (or similar) before charging money.
const SLOTS = { starter: 5, growth: 25, scale: 60, enterprise: Infinity };
// Mirror of `core: true` in frontend/src/billing/catalog.ts: always on, never take a slot.
const CORE = new Set(['events', 'my-tasks', 'run-of-show', 'documents', 'staff', 'assistant']);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const today = () => new Date().toISOString().slice(0, 10);

// Same date rules as normalize() in plan.ts.
function effectivePlan(w) {
  if (w.pendingPlan && w.cancelAt && w.cancelAt <= today()) return w.pendingPlan;
  if (w.trialEndsAt && w.trialEndsAt < today()) return 'starter';
  return w.plan;
}

function hasModule(w, id) {
  if (!w || CORE.has(id)) return true; // no stored workspace = account from before billing: keep access
  const plan = effectivePlan(w);
  if (plan === 'enterprise') return true;
  const at = w.addOns.indexOf(id);
  return at !== -1 && at < (SLOTS[plan] ?? 0);
}

// Whitelist the fields; drop core ids so they can never show up as removable add-ons.
function clean(body) {
  const w = body || {};
  if (!(w.plan in SLOTS)) return null;
  const day = (v) => (typeof v === 'string' && ISO_DAY.test(v) ? v : undefined);
  const ids = (v) => [...new Set((Array.isArray(v) ? v : []).filter((x) => typeof x === 'string' && x.length <= 60 && !CORE.has(x)))].slice(0, 200);
  return {
    plan: w.plan,
    cycle: w.cycle === 'annual' ? 'annual' : 'monthly',
    addOns: ids(w.addOns),
    renewsAt: day(w.renewsAt) ?? today(),
    trialEndsAt: day(w.trialEndsAt),
    cancelAt: day(w.cancelAt),
    pendingPlan: w.pendingPlan in SLOTS ? w.pendingPlan : undefined,
    onboarded: !!w.onboarded,
    eventTypes: ids(w.eventTypes).slice(0, 10),
    lastUsed: w.lastUsed && typeof w.lastUsed === 'object' ? Object.fromEntries(Object.entries(w.lastUsed).filter(([, v]) => Number.isFinite(v)).slice(0, 200)) : undefined,
    notify: ids(w.notify),
  };
}

// Staff use their organizer's plan. ponytail: a staff member on several organizers' events gets the
// first one's; event routes check the event's own organizer, so this only affects which pages show.
async function ownerOf(user) {
  if (user.role !== 'staff') return user.userId;
  const ev = await Event.findOne({ staff: user.userId }).select('organizer').lean();
  return ev?.organizer ?? user.userId;
}
const workspaceOf = async (userId) => (await User.findById(userId).select('workspace').lean())?.workspace;

/** Route guard. Event routes check the event organizer's plan; others the caller's (or their organizer's). */
const requireModule = (id) => async (req, res, next) => {
  try {
    let owner;
    if (req.params.eventId) {
      const ev = await Event.findById(req.params.eventId).select('organizer').lean().catch(() => null);
      if (!ev) return next(); // the route itself answers 404
      owner = ev.organizer;
    } else owner = await ownerOf(req.user);
    if (hasModule(await workspaceOf(owner), id)) return next();
    res.status(403).json({ message: `The ${id} module is not on this workspace's plan. The organizer can add it under Modules.` });
  } catch (err) {
    next(err);
  }
};

router.use(authenticate);

router.get('/workspace', async (req, res, next) => {
  try {
    res.json({ workspace: (await workspaceOf(await ownerOf(req.user))) ?? null });
  } catch (err) {
    next(err);
  }
});

router.put('/workspace', async (req, res, next) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ message: 'Only organizers manage billing' });
    const workspace = clean(req.body);
    if (!workspace) return res.status(400).json({ message: 'Unknown plan' });
    await User.updateOne({ _id: req.user.userId }, { workspace });
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, requireModule, hasModule };
