const mongoose = require('mongoose');

// One running conversation per user. `messages` holds provider-neutral AI SDK
// ModelMessages, so the model can be swapped without breaking saved history.
const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

// A risky API call the agent proposed. It only runs when the user clicks Confirm,
// so the model can never approve its own deletes.
const actionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
    summary: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed', 'cancelled'],
      default: 'pending',
    },
    result: { type: String, default: null },
    // Resolved actions are reported to the model once, on the user's next message.
    reported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = {
  AgentConversation: mongoose.model('AgentConversation', conversationSchema),
  AgentAction: mongoose.model('AgentAction', actionSchema),
};
