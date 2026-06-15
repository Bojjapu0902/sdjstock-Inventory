const mongoose = require('mongoose');

const stockUsedSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  date:      { type: String, default: '' },
  purpose:   { type: String, default: '' },
  items: [{
    itemId:   { type: String, default: '' },
    itemName: { type: String, default: '' },
    category: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    unit:     { type: String, default: '' },
    notes:    { type: String, default: '' },
  }],
  // backward-compat flat fields for old records
  itemId:   { type: String, default: '' },
  itemName: { type: String, default: '' },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  unit:     { type: String, default: '' },
  notes:    { type: String, default: '' },
});

module.exports = mongoose.model('StockUsed', stockUsedSchema);