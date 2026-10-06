const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['organizer', 'staff'],
      default: 'organizer',
    },
    // Billing entitlements, see billing/billing.js.
    workspace: { type: mongoose.Schema.Types.Mixed },
    // Connected apps, see integration/integration.js. Never sent to the client in full.
    integrations: {
      slackUrl: String,
      zapierUrl: String,
      calendarToken: { type: String, index: { unique: true, sparse: true } },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);