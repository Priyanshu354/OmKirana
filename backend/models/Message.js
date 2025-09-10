const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: { type: String, index: true },
  from:   { type: String, required: true },
  to:     { type: String, required: true },
  text:   { type: String, required: true },
  ts:     { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  seen:   { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ from: 1, to: 1, ts: -1 });

module.exports = mongoose.model('Message', messageSchema);
