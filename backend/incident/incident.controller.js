const repo = require('./incident.repository');
const Incident = require('./incident.model');

const FIELDS = ['title', 'description', 'location', 'priority', 'assignedTo'];
const pick = (body) =>
  Object.fromEntries(
    FIELDS.filter((f) => body[f] !== undefined && body[f] !== null).map((f) => [f, body[f]])
  );

const VALID_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
};

// POST /api/events/:eventId/incidents - organizer reports an incident, optionally
exports.create = async (req, res, next) => {
  try {
    const data = pick(req.body);

    if (data.assignedTo && !req.event.staff.some((s) => s.toString() === data.assignedTo)) {
      return res.status(400).json({ message: 'Assignee must be staff on this event' });
    }

    data.event = req.params.eventId;
    data.reportedBy = req.user.userId;

    const created = await repo.create(data);
    // Re-read so reportedBy/assignedTo come back populated, like every other response.
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
    res.json(req.incident);
  } catch (err) {
    next(err);
  }
};

// PATCH /:id - status transitions only
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    const incident = req.incident;
    const allowed = VALID_TRANSITIONS[incident.status] || [];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: `Cannot move an incident from ${incident.status} to ${status}` });
    }
    if (status === 'In Progress' && !incident.assignedTo) {
      return res.status(400).json({ message: 'Assign a staff member before moving to In Progress' });
    }

    const data = { status, resolvedAt: status === 'Resolved' ? new Date() : null };
    res.json(await repo.update(incident._id, data));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await repo.remove(req.params.id);
    if (!item) return res.status(404).json({ message: 'Incident not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// POST /:id/assign - organizer hands (or reassigns) an incident to staff on the event.
exports.assign = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ message: 'staffId is required' });

    if (!req.event.staff.some((s) => s.toString() === staffId)) {
      return res.status(400).json({ message: 'Assignee must be staff on this event' });
    }

    const incident = await Incident.findOne({ _id: req.params.id, event: req.event._id });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    res.json(await repo.update(incident._id, { assignedTo: staffId }));
  } catch (err) {
    next(err);
  }
};
