const router = require('express').Router();
const auth   = require('../middleware/auth');
const SU     = require('../models/StockUsed');

// GET /api/stock-used  → { [projectId]: StockUsed[] }
router.get('/', auth, async (req, res) => {
  try {
    const docs = await SU.find({}).lean();
    const map = {};
    docs.forEach((d) => {
      if (!map[d.projectId]) map[d.projectId] = [];
      const { _id, __v, ...rest } = d;
      map[d.projectId].push(rest);
    });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/stock-used/:projectId
router.get('/:projectId', auth, async (req, res) => {
  try {
    const docs = await SU.find({ projectId: req.params.projectId }).lean();
    res.json(docs.map(({ _id, __v, ...r }) => r));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/stock-used/:projectId
router.post('/:projectId', auth, async (req, res) => {
  try {
    const id = `SU-${Date.now()}`;
    const doc = await SU.create({ id, projectId: req.params.projectId, ...req.body });
    const { _id, __v, ...out } = doc.toObject();
    res.status(201).json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/stock-used/:projectId/:recordId
router.delete('/:projectId/:recordId', auth, async (req, res) => {
  try {
    await SU.findOneAndDelete({ projectId: req.params.projectId, id: req.params.recordId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;