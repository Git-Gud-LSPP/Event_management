const Event = require('./event.model');

// Data access only. Keep query/mongoose specifics in here.
module.exports = {
  create: (data) => Event.create(data),

  findAll: ({ status, skip = 0, limit = 20 } = {}) =>
    Event.find(status ? { status } : {})
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit),

  count: ({ status } = {}) => Event.countDocuments(status ? { status } : {}),

  findById: (id) => Event.findById(id),

  update: (id, data) =>
    Event.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  remove: (id) => Event.findByIdAndDelete(id),
};
