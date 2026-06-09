const mongoose = require('mongoose');

const stockRecordSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  qty:       { type: Number, default: 0 },
  rate:      { type: Number, default: 0 },
  supplier:  { type: String, default: '' },
  timestamp: { type: String, default: '' },
  date:      { type: String, default: '' },
  time:      { type: String, default: '' },
  loggedBy:  { type: String, default: '' },
  notes:     { type: String, default: '' },
}, { _id: false });

const inventoryItemSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  category:     { type: String, required: true },
  unit:         { type: String, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  minStock:     { type: Number, required: true, default: 0 },
  maxStock:     { type: Number, required: true, default: 0 },
  unitCost:     { type: Number, required: true, default: 0 },
  location:     { type: String, default: '' },
  expiryDate:   { type: String, default: '' },
  supplier:     { type: String, default: '' },
  stockRecords: { type: [stockRecordSchema], default: [] },
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
