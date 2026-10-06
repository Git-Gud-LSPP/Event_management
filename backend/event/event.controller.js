const repo = require('./event.repository');
const Event = require('./event.model');
const User = require('../auth/user.model');
const FloorPlan = require('../floorplan/floorplan.model');

// Everything that hangs off an event; removed with it so nothing is left orphaned.
const CHILDREN = [
  require('../schedule/schedule.model'),
  FloorPlan,
  require('../incident/incident.model'),
  require('../inventory/inventory.model'),
  require('../document/document.model'),
  require('../procurement/procurement.model'),
];

// Only fields a client is allowed to set.
const FIELDS = ['title', 'description', 'location', 'startsAt', 'endsAt', 'capacity', 'status'];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.create = async (req, res, next) => {
  try {
    const eventData = pick(req.body);
    eventData.organizer = req.user.userId;
    res.status(201).json(await repo.create(eventData));
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status } = req.query;
    const userId = req.user.userId;

    const query = {
      $or: [
        { organizer: userId },
        { staff: userId },
      ],
    };
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      repo.findAll({ ...query, skip: (page - 1) * limit, limit }),
      repo.count(query),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    // The guard loaded the event with raw staff ids; the client wants names.
    res.json(await req.event.populate('staff', 'name email'));
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
    await Promise.all(CHILDREN.map((M) => M.deleteMany({ event: event._id })));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.addStaff = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    if (!(await User.exists({ _id: staffId }))) {
      return res.status(400).json({ message: 'No such user' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { staff: staffId } },
      { new: true }
    ).populate('staff', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.removeStaff = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $pull: { staff: staffId } },
      { new: true }
    ).populate('staff', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // A placement for a non-staff user fails floor plan validation, so the next save would 400.
    await FloorPlan.updateOne(
      { event: event._id },
      { $pull: { 'floors.$[].placements': { user: staffId } } }
    );
    res.json(event);
  } catch (err) {
    next(err);
  }
};
