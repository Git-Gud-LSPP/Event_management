const mongoose = require('mongoose');

const budgetLineSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'Other' },
    planned: { type: Number, min: 0, default: 0 },
    actual: { type: Number, min: 0, default: 0 },
    owner: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BudgetLine', budgetLineSchema);
