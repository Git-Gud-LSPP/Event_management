const Schedule = require('./schedule.model');

const withRefs = (q) =>
  q.populate('owner', 'name email').populate('dependsOn', 'name');

module.exports = {
  create: (data) => Schedule.create(data),

  findByEvent: ({ eventId, skip = 0, limit = 50 } = {}) =>
    withRefs(
      Schedule.find({ event: eventId })
        .sort({ startsAt: 1 })
        .skip(skip)
        .limit(limit)
    ),

  countByEvent: (eventId) => Schedule.countDocuments({ event: eventId }),

  findById: (id) => withRefs(Schedule.findById(id)),

  update: (id, data) =>
    withRefs(
      Schedule.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    ),

  remove: (id) => Schedule.findByIdAndDelete(id),
};
