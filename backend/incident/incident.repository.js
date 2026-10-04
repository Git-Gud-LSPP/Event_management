const Incident = require('./incident.model');

const withRefs = (q) =>
  q.populate('reportedBy', 'name email').populate('assignedTo', 'name email');

module.exports = {
  create: (data) => Incident.create(data),

  findByEvent: ({ eventId, skip = 0, limit = 50 } = {}) =>
    withRefs(
      Incident.find({ event: eventId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ),

  countByEvent: (eventId) => Incident.countDocuments({ event: eventId }),

  findById: (id) => withRefs(Incident.findById(id)),

  update: (id, data) =>
    withRefs(
      Incident.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    ),

  remove: (id) => Incident.findByIdAndDelete(id),
};
