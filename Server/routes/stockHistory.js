const router = require('express').Router();
const auth   = require('../middleware/auth');
const SH     = require('../models/StockHistory');

// GET /api/stock-history  → { [itemId]: Record[] }
router.get('/', auth, async (req, res) => {
  try {
    const docs = await SH.find({}).lean();
    const map = {};
    docs.forEach((d) => {
      if (!map[d.itemId]) map[d.itemId] = [];
      const { _id, __v, ...rest } = d;
      map[d.itemId].push(rest);
    });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/stock-history/:itemId
router.get('/:itemId', auth, async (req, res) => {
  try {
    const docs = await SH.find({ itemId: req.params.itemId }).sort({ timestamp: -1 }).lean();
    res.json(docs.map(({ _id, __v, ...r }) => r));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/stock-history/:itemId
router.post('/:itemId', auth, async (req, res) => {
  try {
    const id = `SH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const doc = await SH.create({ id, itemId: req.params.itemId, ...req.body });
    const { _id, __v, ...out } = doc.toObject();
    res.status(201).json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/stock-history/:itemId/:recordId
router.put('/:itemId/:recordId', auth, async (req, res) => {
  try {
    const doc = await SH.findOneAndUpdate(
      { itemId: req.params.itemId, id: req.params.recordId },
      req.body, { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Record not found' });
    const { _id, __v, ...out } = doc;
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/stock-history/:itemId/:recordId
router.delete('/:itemId/:recordId', auth, async (req, res) => {
  try {
    await SH.findOneAndDelete({ itemId: req.params.itemId, id: req.params.recordId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;