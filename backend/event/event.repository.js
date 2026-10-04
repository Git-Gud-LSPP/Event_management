const Event = require('./event.model');

// Data access only. Keep query/mongoose specifics in here.
// Anything that is not skip/limit is treated as a mongo filter, so the caller's
// scoping (organizer/staff, status, ...) actually reaches the query.
module.exports = {
  create: (data) => Event.create(data),

  findAll: ({ skip = 0, limit = 20, ...filter } = {}) =>
    Event.find(filter)
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('staff', 'name email'),

  count: (filter = {}) => Event.countDocuments(filter),

  findById: (id) => Event.findById(id),

  update: (id, data) =>
    Event.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  remove: (id) => Event.findByIdAndDelete(id),
};
