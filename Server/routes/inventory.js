const router = require('express').Router();
const auth   = require('../middleware/auth');
const Item   = require('../models/InventoryItem');

// GET /api/inventory
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({}).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/inventory/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory
router.post('/', auth, async (req, res) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/inventory/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, __v, ...update } = req.body;
    const item = await Item.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/inventory/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Item.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Stock-record sub-routes (embedded in InventoryItem) ──────────────────

// POST /api/inventory/:id/stock-records  — push a new record + increment currentStock
router.post('/:id/stock-records', auth, async (req, res) => {
  try {
    const { qty, rate, supplier = '', timestamp = '', date = '', time = '', loggedBy = '', notes = '' } = req.body;
    const recordId = `SR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const item = await Item.findOneAndUpdate(
      { id: req.params.id },
      {
        $push: { stockRecords: { id: recordId, qty: +qty, rate: +rate, supplier, timestamp, date, time, loggedBy, notes } },
        $inc:  { currentStock: +qty },
      },
      { new: true }
    ).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/inventory/:id/stock-records/:recordId  — update record + adjust currentStock by delta
router.put('/:id/stock-records/:recordId', auth, async (req, res) => {
  try {
    const { qty, rate, supplier = '', timestamp = '', date = '', time = '', notes = '' } = req.body;
    const existing = await Item.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const old = (existing.stockRecords || []).find((r) => r.id === req.params.recordId);
    if (!old) return res.status(404).json({ error: 'Stock record not found' });
    const delta = +qty - old.qty;
    const item = await Item.findOneAndUpdate(
      { id: req.params.id, 'stockRecords.id': req.params.recordId },
      {
        $set: {
          'stockRecords.$.qty':       +qty,
          'stockRecords.$.rate':      +rate,
          'stockRecords.$.supplier':  supplier,
          'stockRecords.$.timestamp': timestamp,
          'stockRecords.$.date':      date,
          'stockRecords.$.time':      time,
          'stockRecords.$.notes':     notes,
        },
        $inc: { currentStock: delta },
      },
      { new: true }
    ).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/inventory/:id/stock-records/:recordId/type  — set type (true=visible, false=hidden)
router.patch('/:id/stock-records/:recordId/type', auth, async (req, res) => {
  try {
    const { type } = req.body;
    const item = await Item.findOneAndUpdate(
      { id: req.params.id, 'stockRecords.id': req.params.recordId },
      { $set: { 'stockRecords.$.type': !!type } },
      { new: true }
    ).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/inventory/:id/stock-records/:recordId  — pull record + decrement currentStock
router.delete('/:id/stock-records/:recordId', auth, async (req, res) => {
  try {
    const existing = await Item.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const record = (existing.stockRecords || []).find((r) => r.id === req.params.recordId);
    if (!record) return res.status(404).json({ error: 'Stock record not found' });
    const item = await Item.findOneAndUpdate(
      { id: req.params.id },
      {
        $pull: { stockRecords: { id: req.params.recordId } },
        $inc:  { currentStock: -record.qty },
      },
      { new: true }
    ).lean();
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory/bulk-deduct  — subtract stock for multiple items
router.post('/bulk-deduct', auth, async (req, res) => {
  try {
    const { items } = req.body; // [{ itemId, quantity }]
    const result = {};
    for (const { itemId, quantity } of items) {
      const item = await Item.findOne({ id: itemId });
      if (item) {
        item.currentStock = Math.max(0, item.currentStock - Number(quantity));
        await item.save();
        result[itemId] = item.currentStock;
      }
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory/bulk-restore  — restore stock for multiple items
router.post('/bulk-restore', auth, async (req, res) => {
  try {
    const { items } = req.body;
    const result = {};
    for (const { itemId, quantity } of items) {
      const item = await Item.findOne({ id: itemId });
      if (item) {
        item.currentStock = item.currentStock + Number(quantity);
        await item.save();
        result[itemId] = item.currentStock;
      }
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;