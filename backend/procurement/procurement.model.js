const mongoose = require('mongoose');

// The procurement pipeline: a vendor this event is buying from (or considering).
// Vendor search results are not stored anywhere, so this is also where vendor contact
// details live for documents (RFQs, POs, contracts) and for the agent.
const STAGES = ['Shortlisted', 'RFQ Sent', 'Quoted', 'Booked', 'Paid', 'Rejected'];

const eventVendorSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    contactName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    address: { type: String, trim: true },
    latitude: Number,
    longitude: Number,
    // Vendor search id (e.g. "node-123"), so the same place is not added twice.
    sourceId: { type: String, trim: true },
    stage: { type: String, enum: STAGES, default: 'Shortlisted' },
    // What we are buying from them and for how much, once quoted.
    scope: { type: String, trim: true },
    quoteAmount: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, maxlength: 3 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

eventVendorSchema.index(
  { event: 1, sourceId: 1 },
  { unique: true, partialFilterExpression: { sourceId: { $type: 'string' } } }
);

module.exports = mongoose.model('EventVendor', eventVendorSchema);
module.exports.STAGES = STAGES;
