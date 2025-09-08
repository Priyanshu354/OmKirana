const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from:   { type: String, required: true },
  to:     { type: String, required: true },
  text:   { type: String, required: true },
  ts:     { type: Date, default: Date.now },
  seen:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
