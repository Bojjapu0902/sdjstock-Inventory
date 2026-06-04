const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  category:     { type: String, required: true },
  unit:         { type: String, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  minStock:     { type: Number, required: true },
  maxStock:     { type: Number, required: true },
  unitCost:     { type: Number, required: true },
  location:     { type: String, default: '' },
  expiryDate:   { type: String, default: '' },
  supplier:     { type: String, default: '' },
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);