const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  category:     { type: String, default: '' },
  contact:      { type: String, default: '' },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  city:         { type: String, default: '' },
  country:      { type: String, default: 'India' },
  rating:       { type: Number, default: 4.0 },
  totalOrders:  { type: Number, default: 0 },
  totalSpend:   { type: Number, default: 0 },
  status:       { type: String, default: 'Active' },
  since:        { type: String, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
});

module.exports = mongoose.model('Supplier', supplierSchema);