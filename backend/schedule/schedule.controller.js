const repo = require('./schedule.repository');
const Schedule = require('./schedule.model');

const FIELDS = [
  'name',
  'owner',
  'startsAt',
  'endsAt',
  'status',
  'dependsOn',
  'delayMinutes',
];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.create = async (req, res, next) => {
  try {
    const data = pick(req.body);
    data.event = req.params.eventId;
    const created = await repo.create(data);
    // Re-read so owner/dependsOn come back populated, like every other response.
    res.status(201).json(await repo.findById(created._id));
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const eventId = req.params.eventId;

    const [items, total] = await Promise.all([
      repo.findByEvent({ eventId, skip: (page - 1) * limit, limit }),
      repo.countByEvent(eventId),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    res.json(req.scheduleItem);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = pick(req.body);
    // Staff may only move their own task across the board (status), nothing else.
    if (!req.isOrganizer) {
      const ownsTask = req.scheduleItem.owner?.toString() === req.user.userId;
      if (!ownsTask || Object.keys(data).some((f) => f !== 'status')) {
        return res.status(403).json({ message: 'Staff can only change the status of their own tasks' });
      }
    }
    const item = await repo.update(req.params.id, data);
    if (!item) return res.status(404).json({ message: 'Schedule item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await repo.remove(req.params.id);
    if (!item) return res.status(404).json({ message: 'Schedule item not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
// POST /:id/tasks-assign - organizer hands a schedule task to a staff member on the event.
exports.assign = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    if (!assigneeId) return res.status(400).json({ message: 'assigneeId is required' });

    if (!req.event.staff.some((s) => s.toString() === assigneeId)) {
      return res.status(400).json({ message: 'Assignee must be staff on this event' });
    }

    const item = await Schedule.findOne({ _id: req.params.id, event: req.event._id });
    if (!item) return res.status(404).json({ message: 'Schedule item not found' });

    res.json(await repo.update(item._id, { owner: assigneeId }));
  } catch (err) {
    next(err);
  }
};

// Dependency alert chains, derived from dependsOn + status/delay; nothing is stored.
// A trigger is a Blocked or delayed task whose own upstream is fine; its chain is
// every task downstream of it, in dependency order.
const buildChains = (tasks) => {
  const key = (t) => String(t._id);
  const children = new Map();
  for (const t of tasks) {
    if (!t.dependsOn) continue;
    const parent = String(t.dependsOn._id || t.dependsOn);
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(t);
  }
  const byId = new Map(tasks.map((t) => [key(t), t]));
  const troubled = (t) => t && (t.status === 'Blocked' || (t.delayMinutes || 0) > 0);

  return tasks
    .filter((t) => troubled(t) && t.status !== 'Done' && !troubled(byId.get(String(t.dependsOn?._id || t.dependsOn || ''))))
    .map((root) => {
      const delay = root.delayMinutes || 0;
      const chain = [];
      const seen = new Set([key(root)]);
      const queue = [...(children.get(key(root)) || [])];
      while (queue.length) {
        const t = queue.shift();
        if (seen.has(key(t))) continue; // guards against dependency cycles
        seen.add(key(t));
        if (t.status !== 'Done') {
          chain.push({
            id: key(t),
            label: t.name,
            impact: delay ? `Start pushed ~${delay} min` : `Waiting on "${root.name}"`,
            severity: chain.length === 0 ? 'high' : 'critical',
          });
        }
        queue.push(...(children.get(key(t)) || []));
      }
      return {
        id: key(root),
        trigger: {
          taskId: key(root),
          label: delay ? `${root.name} delayed ${delay} min` : `${root.name} blocked`,
          type: root.status === 'Blocked' ? 'blocked' : 'delay',
          time: root.startsAt,
        },
        chain,
      };
    })
    .filter((c) => c.chain.length > 0);
};
exports.buildChains = buildChains;

exports.chains = async (req, res, next) => {
  try {
    const tasks = await Schedule.find({ event: req.event._id }).lean();
    res.json({ items: buildChains(tasks) });
  } catch (err) {
    next(err);
  }
};
