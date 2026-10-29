const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  username:  { type: String, default: '' },
  messages:  { type: [messageSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
