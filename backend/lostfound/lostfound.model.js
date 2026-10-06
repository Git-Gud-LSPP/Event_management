const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    item: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    foundAt: { type: String, trim: true },
    storedAt: { type: String, trim: true },
    status: { type: String, enum: ['Found', 'Claimed'], default: 'Found' },
    claimedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LostItem', lostItemSchema);
