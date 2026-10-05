const Incident = require('./incident.model');

const withRefs = (q) =>
  q.populate('reportedBy', 'name email').populate('assignedTo', 'name email');

const isEventStaff = (event, userId) => event.staff.some((s) => s.toString() === userId);

// Scoped to the event so an id from another event 404s instead of leaking.
const findInEvent = (req) => Incident.findOne({ _id: req.params.id, event: req.event._id });

exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const filter = { event: req.event._id };
    const [items, total] = await Promise.all([
      withRefs(Incident.find(filter).sort({ createdAt: -1 }).limit(limit)),
      Incident.countDocuments(filter),
    ]);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const item = await withRefs(findInEvent(req));
    if (!item) return res.status(404).json({ message: 'Incident not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, location, priority, assignedTo } = req.body;
    if (assignedTo && !isEventStaff(req.event, assignedTo)) {
      return res.status(400).json({ message: 'Assignee must be staff on this event' });
    }
    const created = await Incident.create({
      event: req.event._id,
      title,
      description,
      location,
      priority,
      assignedTo: assignedTo || null,
      reportedBy: req.user.userId,
    });
    res.status(201).json(await withRefs(Incident.findById(created._id)));
  } catch (err) {
    next(err);
  }
};

// PATCH /:id - status only; organizer or the assigned staff member.
exports.updateStatus = async (req, res, next) => {
  try {
    const item = await findInEvent(req);
    if (!item) return res.status(404).json({ message: 'Incident not found' });

    const isAssignee = item.assignedTo?.toString() === req.user.userId;
    if (!req.isOrganizer && !isAssignee) {
      return res.status(403).json({ message: 'Only the organizer or assignee can update status' });
    }

    item.status = req.body.status;
    item.resolvedAt = item.status === 'Resolved' ? new Date() : null;
    await item.save();
    res.json(await withRefs(Incident.findById(item._id)));
  } catch (err) {
    next(err);
  }
};

exports.assign = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ message: 'staffId is required' });
    if (!isEventStaff(req.event, staffId)) {
      return res.status(400).json({ message: 'Assignee must be staff on this event' });
    }
    const item = await withRefs(
      Incident.findOneAndUpdate(
        { _id: req.params.id, event: req.event._id },
        { assignedTo: staffId },
        { new: true }
      )
    );
    if (!item) return res.status(404).json({ message: 'Incident not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Incident.findOneAndDelete({ _id: req.params.id, event: req.event._id });
    if (!item) return res.status(404).json({ message: 'Incident not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
