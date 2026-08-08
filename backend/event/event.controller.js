const repo = require('./event.repository');

// Only fields a client is allowed to set.
const FIELDS = ['title', 'description', 'location', 'startsAt', 'endsAt', 'capacity', 'status'];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.create = async (req, res, next) => {
  try {
    res.status(201).json(await repo.create(pick(req.body)));
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status } = req.query;
    const [items, total] = await Promise.all([
      repo.findAll({ status, skip: (page - 1) * limit, limit }),
      repo.count({ status }),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const event = await repo.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const event = await repo.update(req.params.id, pick(req.body));
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const event = await repo.remove(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
