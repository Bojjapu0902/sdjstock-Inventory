const mongoose = require('mongoose');

const stockReceivedSchema = new mongoose.Schema({
  submissionId:   { type: String, required: true },
  projectId:      { type: String, required: true, index: true },
  adminName:      { type: String, default: '' },
  date:           { type: String, default: '' },
  time:           { type: String, default: '' },
  submittedAt:    { type: String, default: '' },
  items:          { type: mongoose.Schema.Types.Mixed, default: [] },
  totalItems:     { type: Number, default: 0 },
  totalValue:     { type: String, default: '0.00' },
  approvalStatus: { type: String, default: 'pending' },
  approvedAt:     { type: String, default: null },
  approvedBy:     { type: String, default: null },
});

stockReceivedSchema.index({ projectId: 1, submissionId: 1 }, { unique: true });

module.exports = mongoose.model('StockReceived', stockReceivedSchema);