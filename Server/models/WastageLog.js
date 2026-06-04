const mongoose = require('mongoose');

const wastageLogSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  date:       { type: String, required: true },
  item:       { type: String, required: true },
  category:   { type: String, default: '' },
  qty:        { type: Number, required: true },
  unit:       { type: String, default: 'kg' },
  reason:     { type: String, required: true },
  costImpact: { type: Number, default: 0 },
  loggedBy:   { type: String, default: '' },
  notes:      { type: String, default: '' },
});

module.exports = mongoose.model('WastageLog', wastageLogSchema);