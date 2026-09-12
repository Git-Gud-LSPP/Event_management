const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
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
    capacity: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
      default: 'draft',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
