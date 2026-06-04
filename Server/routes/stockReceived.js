const router = require('express').Router();
const auth   = require('../middleware/auth');
const SR     = require('../models/StockReceived');

// GET /api/stock-received  → { [projectId]: Submission[] }
router.get('/', auth, async (req, res) => {
  try {
    const docs = await SR.find({}).lean();
    const map = {};
    docs.forEach((d) => {
      const { submissionId, projectId, _id, __v, ...rest } = d;
      if (!map[projectId]) map[projectId] = [];
      map[projectId].push({ id: submissionId, ...rest });
    });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/stock-received/:projectId → Submission[]
router.get('/:projectId', auth, async (req, res) => {
  try {
    const docs = await SR.find({ projectId: req.params.projectId }).lean();
    res.json(docs.map(({ submissionId, _id, __v, ...rest }) => ({ id: submissionId, ...rest })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/stock-received/:projectId
router.post('/:projectId', auth, async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const doc = await SR.create({ submissionId: id, projectId: req.params.projectId, ...rest });
    const { submissionId, _id, __v, ...out } = doc.toObject();
    res.status(201).json({ id: submissionId, ...out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/stock-received/:projectId/:submissionId
router.put('/:projectId/:submissionId', auth, async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const doc = await SR.findOneAndUpdate(
      { projectId: req.params.projectId, submissionId: req.params.submissionId },
      { submissionId: id || req.params.submissionId, ...rest },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Submission not found' });
    const { submissionId, _id, __v, ...out } = doc;
    res.json({ id: submissionId, ...out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/stock-received/:projectId/:submissionId
router.delete('/:projectId/:submissionId', auth, async (req, res) => {
  try {
    await SR.findOneAndDelete({ projectId: req.params.projectId, submissionId: req.params.submissionId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/stock-received/:projectId/:submissionId/approve
router.post('/:projectId/:submissionId/approve', auth, async (req, res) => {
  try {
    const { approvalItems, approvedBy } = req.body;
    const doc = await SR.findOne({ projectId: req.params.projectId, submissionId: req.params.submissionId });
    if (!doc) return res.status(404).json({ error: 'Submission not found' });

    doc.approvalStatus = 'approved';
    doc.approvedAt     = new Date().toISOString();
    doc.approvedBy     = approvedBy;
    doc.items = (doc.items || []).map((item, idx) => ({
      ...item,
      userApproved: approvalItems[idx]?.approved ?? false,
      userComment:  approvalItems[idx]?.comment  ?? '',
    }));
    await doc.save();

    const { submissionId, _id, __v, ...out } = doc.toObject();
    res.json({ id: submissionId, ...out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;