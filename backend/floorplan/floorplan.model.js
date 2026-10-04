const mongoose = require('mongoose');

// Rooms carry a client-generated string id, not a Mongo _id: the whole plan is replaced on
// every save, which would renumber _ids and break the placement -> room links.
const roomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    capacity: { type: Number, min: 0, default: 0 },
    color: { type: String, default: '#e4f7f9' },
  },
  { _id: false }
);

const placementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, default: null }, // null = loose on the floor
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const floorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rooms: [roomSchema],
    placements: [placementSchema],
  },
  { _id: false }
);

const floorPlanSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
      index: true,
    },
    floors: [floorSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('FloorPlan', floorPlanSchema);
