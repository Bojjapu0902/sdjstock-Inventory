const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
  id:        { type: String, required: true },
  itemId:    { type: String, required: true, index: true },
  timestamp: { type: String, default: '' },
  qty:       { type: Number, default: 0 },
  rate:      { type: Number, default: 0 },
  unit:      { type: String, default: '' },
  desc:      { type: String, default: '' },
});

module.exports = mongoose.model('StockHistory', stockHistorySchema);