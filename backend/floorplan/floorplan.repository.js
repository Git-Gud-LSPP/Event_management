const FloorPlan = require('./floorplan.model');

// Data access only. Keep query/mongoose specifics in here.
module.exports = {
  findByEvent: (eventId) => FloorPlan.findOne({ event: eventId }),

  upsert: (eventId, floors) =>
    FloorPlan.findOneAndUpdate(
      { event: eventId },
      { event: eventId, floors },
      { new: true, upsert: true, runValidators: true }
    ),
};
