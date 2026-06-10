const mongoose = require('mongoose');

const submissionItemSchema = new mongoose.Schema({
  itemId:       { type: String,  default: '' },
  itemName:     { type: String,  default: '' },
  category:     { type: String,  default: '' },
  quantity:     { type: Number,  default: 0  },
  unit:         { type: String,  default: '' },
  rate:         { type: Number,  default: 0  },
  total:        { type: Number,  default: 0  },
  notes:        { type: String,  default: '' },
  supplier:     { type: String,  default: '' },
  userApproved: { type: Boolean, default: false },
  userComment:  { type: String,  default: '' },
}, { _id: false });

const stockSubmissionSchema = new mongoose.Schema({
  id:             { type: String, required: true },
  adminName:      { type: String, default: '' },
  date:           { type: String, default: '' },
  time:           { type: String, default: '' },
  submittedAt:    { type: String, default: '' },
  totalValue:     { type: mongoose.Schema.Types.Mixed, default: 0 },
  approvalStatus: { type: String, default: 'pending' },
  approvedAt:     { type: String, default: '' },
  approvedBy:     { type: String, default: '' },
  items:          { type: [submissionItemSchema], default: [] },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  location:      { type: String, default: '' },
  address:       { type: String, default: '' },
  status:        { type: String, default: 'Active' },
  manager:       { type: String, default: '' },
  phone:         { type: String, default: '' },
  email:         { type: String, default: '' },
  description:   { type: String, default: '' },
  capacity:      { type: String, default: '' },
  createdAt:     { type: String, default: () => new Date().toISOString().split('T')[0] },
  stockReceived: { type: [stockSubmissionSchema], default: [] },
});

module.exports = mongoose.model('Project', projectSchema);
