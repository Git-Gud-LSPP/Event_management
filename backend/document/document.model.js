const mongoose = require('mongoose');

// The event's document hub: contracts, quotes, POs, invoices, permits, plans...
// Either written in the app (markdown `content`, e.g. drafted by the agent) or uploaded
// (`file`, with its extracted text in `content` so the agent can read it too).
const CATEGORIES = [
  'Contract', 'Quote', 'RFQ', 'Purchase Order', 'Invoice', 'Receipt',
  'Permit', 'Insurance', 'Plan', 'Other',
];
const STATUSES = ['Draft', 'Sent', 'Received', 'Approved', 'Signed', 'Paid', 'Void'];
const MAX_CONTENT = 100_000;

const documentSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    status: { type: String, enum: STATUSES, default: 'Draft' },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'EventVendor', default: null },
    // Money on quotes, POs, invoices and receipts.
    amount: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, maxlength: 3 },
    dueDate: { type: Date },
    content: { type: String, default: '', maxlength: MAX_CONTENT },
    // ponytail: files live in Mongo (5 MB cap, 16 MB doc limit). Move to GridFS/S3
    // if people start uploading big scans.
    file: {
      name: String,
      mime: String,
      size: Number,
      data: { type: Buffer, select: false },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
Object.assign(module.exports, { CATEGORIES, STATUSES, MAX_CONTENT });
