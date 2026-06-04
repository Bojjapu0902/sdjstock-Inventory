const mongoose = require('mongoose');

const stockUsedSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  itemId:    { type: String, default: '' },
  itemName:  { type: String, default: '' },
  category:  { type: String, default: '' },
  quantity:  { type: Number, default: 0 },
  unit:      { type: String, default: '' },
  usedBy:    { type: String, default: '' },
  date:      { type: String, default: '' },
  notes:     { type: String, default: '' },
});

module.exports = mongoose.model('StockUsed', stockUsedSchema);