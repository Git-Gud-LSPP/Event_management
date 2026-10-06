const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    // null = in the event backlog, waiting for someone to take it on.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
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
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Blocked', 'Done'],
      default: 'Pending',
    },
    // Task that must finish first; drives the "Blocked" status in the UI.
    dependsOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      default: null,
    },
    delayMinutes: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

scheduleSchema.index({ event: 1, startsAt: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
