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
    const item = await Item.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
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