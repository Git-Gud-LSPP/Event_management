const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    stock: { type: Number, min: 0, default: 0 },
    maxStock: { type: Number, min: 0, default: 0 },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Available', 'Low Stock', 'Damaged', 'Checked Out', 'Ordered'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
