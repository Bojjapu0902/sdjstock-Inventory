const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  supplier:      { type: String, required: true },
  date:          { type: String, required: true },
  deliveryDate:  { type: String, default: '' },
  items:         { type: Number, default: 0 },
  totalValue:    { type: Number, default: 0 },
  status:        { type: String, default: 'Draft' },
  paymentStatus: { type: String, default: 'Unpaid' },
  notes:         { type: String, default: '' },
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);