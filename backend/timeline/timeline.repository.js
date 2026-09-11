const Timeline = require('./timeline.model');

module.exports = {
  create: (data) => Timeline.create(data),

  findByEvent: ({ eventId, skip = 0, limit = 50 } = {}) =>
    Timeline.find({ event: eventId })
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit),

  countByEvent: (eventId) => Timeline.countDocuments({ event: eventId }),

  findById: (id) => Timeline.findById(id),

  update: (id, data) =>
    Timeline.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  remove: (id) => Timeline.findByIdAndDelete(id),
};