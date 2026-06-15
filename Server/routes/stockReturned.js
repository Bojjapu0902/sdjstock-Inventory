const router = require('express').Router();
const auth   = require('../middleware/auth');
const SR     = require('../models/StockReturned');

// GET /api/stock-returned  → { [projectId]: StockReturned[] }
router.get('/', auth, async (req, res) => {
  try {
    const docs = await SR.find({}).lean();
    const map = {};
    docs.forEach((d) => {
      if (!map[d.projectId]) map[d.projectId] = [];
      const { _id, __v, ...rest } = d;
      map[d.projectId].push(rest);
    });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/stock-returned/:projectId
router.get('/:projectId', auth, async (req, res) => {
  try {
    const docs = await SR.find({ projectId: req.params.projectId }).lean();
    res.json(docs.map(({ _id, __v, ...r }) => r));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/stock-returned/:projectId
router.post('/:projectId', auth, async (req, res) => {
  try {
    const id  = `SRT-${Date.now()}`;
    const doc = await SR.create({ id, projectId: req.params.projectId, ...req.body });
    const { _id, __v, ...out } = doc.toObject();
    res.status(201).json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/stock-returned/:projectId/:recordId
router.delete('/:projectId/:recordId', auth, async (req, res) => {
  try {
    await SR.findOneAndDelete({ projectId: req.params.projectId, id: req.params.recordId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
