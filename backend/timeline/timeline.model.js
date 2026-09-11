const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    startsAt: { type: Date, required: true },
    endsAt: {
      type: Date,
      validate: {
        validator(v) {
          return !v || !this.startsAt || v >= this.startsAt;
        },
        message: 'endsAt must be on or after startsAt',
      },
    },
    type: {
      type: String,
      enum: ['session', 'break', 'keynote', 'workshop', 'networking', 'other'],
      default: 'session',
    },
    speaker: { type: String, default: '', trim: true },
    capacity: { type: Number, min: 0 },
  },
  { timestamps: true }
);

timelineSchema.index({ event: 1, startsAt: 1 });

module.exports = mongoose.model('Timeline', timelineSchema);