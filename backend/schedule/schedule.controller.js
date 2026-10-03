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
    const item = await repo.update(req.params.id, pick(req.body));
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
