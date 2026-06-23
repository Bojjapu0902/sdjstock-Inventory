const router = require('express').Router();
const auth   = require('../middleware/auth');
const Item   = require('../models/InventoryItem');

/**
 * Derive currentStock from the full stockRecords array.
 * 'in'  records (stock received)       → add qty
 * 'out' records (assigned to project)  → subtract qty
 */
function recomputeStock(records) {
  return (records || []).reduce((total, r) => {
    const qty = Number(r.qty) || 0;
    return r.direction === 'out' ? total - qty : total + qty;
  }, 0);
}

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
    if (update.currentStock !== undefined) update.currentStock = Math.max(0, Number(update.currentStock) || 0);
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

// ── Stock-record sub-routes ────────────────────────────────────────────────
// After every add / edit / delete, currentStock is recomputed from all records.

// POST /api/inventory/:id/stock-records  — add a stock record
router.post('/:id/stock-records', auth, async (req, res) => {
  try {
    const { qty, rate, supplier = '', timestamp = '', date = '', time = '', loggedBy = '', notes = '' } = req.body;
    const existing = await Item.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const newRecord = {
      id: `SR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      qty: +qty, rate: +rate, supplier, timestamp, date, time, loggedBy, notes,
      direction: 'in',
    };
    const computed = recomputeStock([...(existing.stockRecords || []), newRecord]);

    const item = await Item.findOneAndUpdate(
      { id: req.params.id },
      { $push: { stockRecords: newRecord }, $set: { currentStock: computed } },
      { new: true }
    ).lean();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/inventory/:id/stock-records/:recordId  — edit a stock record
router.put('/:id/stock-records/:recordId', auth, async (req, res) => {
  try {
    const { qty, rate, supplier = '', timestamp = '', date = '', time = '', notes = '' } = req.body;
    const existing = await Item.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const old = (existing.stockRecords || []).find((r) => r.id === req.params.recordId);
    if (!old) return res.status(404).json({ error: 'Stock record not found' });

    const updatedRecords = (existing.stockRecords || []).map((r) =>
      r.id === req.params.recordId ? { ...r, qty: +qty, rate: +rate, supplier, timestamp, date, time, notes } : r
    );
    const computed = recomputeStock(updatedRecords);

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
          currentStock:               computed,
        },
      },
      { new: true }
    ).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/inventory/:id/stock-records/:recordId/type  — toggle active flag
// type has no effect on stock quantity — currentStock is NOT changed here.
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

// DELETE /api/inventory/:id/stock-records/:recordId  — remove a stock record
router.delete('/:id/stock-records/:recordId', auth, async (req, res) => {
  try {
    const existing = await Item.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const record = (existing.stockRecords || []).find((r) => r.id === req.params.recordId);
    if (!record) return res.status(404).json({ error: 'Stock record not found' });

    const remainingRecords = (existing.stockRecords || []).filter((r) => r.id !== req.params.recordId);
    const computed = recomputeStock(remainingRecords);

    const item = await Item.findOneAndUpdate(
      { id: req.params.id },
      { $pull: { stockRecords: { id: req.params.recordId } }, $set: { currentStock: computed } },
      { new: true }
    ).lean();
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/inventory/reset-all-stock — set currentStock=0 for every item
router.patch('/reset-all-stock', auth, async (req, res) => {
  try {
    const result = await Item.updateMany({}, { $set: { currentStock: 0 } });
    res.json({ updated: result.modifiedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory/bulk-deduct  — subtract stock for multiple items (project assignment)
router.post('/bulk-deduct', auth, async (req, res) => {
  try {
    const { items } = req.body;
    const result = {};
    for (const { itemId, qty, projectId = '', projectName = '', submissionId = '', loggedBy = '', date = '', time = '', timestamp = '' } of items) {
      const item = await Item.findOne({ id: itemId });
      if (item) {
        item.currentStock = Math.max(0, item.currentStock - Number(qty));
        item.stockRecords = item.stockRecords || [];
        item.stockRecords.push({
          id:           `SR-OUT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          qty:          Number(qty),
          rate:         0,
          direction:    'out',
          projectId,
          projectName,
          submissionId,
          loggedBy,
          date,
          time,
          timestamp,
        });
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
    for (const { itemId, qty } of items) {
      const item = await Item.findOne({ id: itemId });
      if (item) {
        item.currentStock = item.currentStock + Number(qty);
        await item.save();
        result[itemId] = item.currentStock;
      }
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
