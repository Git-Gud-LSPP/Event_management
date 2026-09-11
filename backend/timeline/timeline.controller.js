const repo = require('./timeline.repository');
const Timeline = require('./timeline.model');

const FIELDS = [
  'title',
  'description',
  'location',
  'startsAt',
  'endsAt',
  'type',
  'speaker',
  'capacity',
];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.create = async (req, res, next) => {
  try {
    const timelineData = pick(req.body);
    timelineData.event = req.params.eventId;
    res.status(201).json(await repo.create(timelineData));
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
    res.json(req.timeline);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const timeline = await repo.update(req.params.id, pick(req.body));
    if (!timeline) return res.status(404).json({ message: 'Timeline item not found' });
    res.json(timeline);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const timeline = await repo.remove(req.params.id);
    if (!timeline) return res.status(404).json({ message: 'Timeline item not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};