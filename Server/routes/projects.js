const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Project = require('../models/Project');
const Item    = require('../models/InventoryItem');

function recomputeStock(records) {
  return (records || []).reduce((total, r) => {
    const qty = Number(r.qty) || 0;
    return r.direction === 'out' ? total - qty : total + qty;
  }, 0);
}

// ── Project CRUD ─────────────────────────────────────────────────────────────

router.get('/', auth, async (req, res) => {
  try { res.json(await Project.find({}).lean()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { stockReceived, ...rest } = req.body;
    const doc = await Project.create({ ...rest, stockReceived: [] });
    res.status(201).json(doc.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, __v, stockReceived, ...update } = req.body;
    const doc = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Project not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Project.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Stock Received sub-routes ─────────────────────────────────────────────────
// Submissions are embedded inside the project document.

// POST /api/projects/:id/stock-received  — push a new submission
router.post('/:id/stock-received', auth, async (req, res) => {
  try {
    const { adminName = '', date = '', time = '', items = [] } = req.body;

    // Stock availability check — reject if any item doesn't have enough currentStock
    const stockDocs = await Promise.all(items.map((it) => Item.findOne({ id: it.itemId }).lean()));
    const insufficient = items.find((it, i) => {
      const available = stockDocs[i]?.currentStock ?? 0;
      return Number(it.quantity) > available;
    });
    if (insufficient) {
      const doc = stockDocs[items.indexOf(insufficient)];
      return res.status(400).json({
        error: `Insufficient stock for "${insufficient.itemName}" — available: ${doc?.currentStock ?? 0} ${insufficient.unit || ''}, requested: ${insufficient.quantity}`,
      });
    }

    const doc = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $push: { stockReceived: req.body } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Project not found' });
    const ts = date && time ? `${date}T${time}:00` : new Date().toISOString();
    await Promise.all(items.map(async (it, idx) => {
      const existing = stockDocs[idx];
      if (!existing) return;
      const outRecord = {
        id:          `OUT-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        qty:         Number(it.quantity),
        rate:        0,
        direction:   'out',
        projectId:   doc.id,
        projectName: doc.name,
        date, time, timestamp: ts, loggedBy: adminName,
      };
      const computed = recomputeStock([...existing.stockRecords, outRecord]);
      return Item.findOneAndUpdate(
        { id: it.itemId },
        { $push: { stockRecords: outRecord }, $set: { currentStock: computed } }
      );
    }));

    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/projects/:id/stock-received/:subId  — replace a submission
router.put('/:id/stock-received/:subId', auth, async (req, res) => {
  try {
    const { _id, __v, projectId, ...update } = req.body;
    const replacement = { ...update, id: update.id || req.params.subId };
    const doc = await Project.findOneAndUpdate(
      { id: req.params.id, 'stockReceived.id': req.params.subId },
      { $set: { 'stockReceived.$': replacement } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Submission not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id/stock-received/:subId  — remove a submission
router.delete('/:id/stock-received/:subId', auth, async (req, res) => {
  try {
    const doc = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $pull: { stockReceived: { id: req.params.subId } } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Project not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects/:id/stock-received/:subId/approve
router.post('/:id/stock-received/:subId/approve', auth, async (req, res) => {
  try {
    const { approvalItems, approvedBy } = req.body;
    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const idx = project.stockReceived.findIndex((s) => s.id === req.params.subId);
    if (idx === -1) return res.status(404).json({ error: 'Submission not found' });

    const sub = project.stockReceived[idx];
    sub.approvalStatus = 'approved';
    sub.approvedAt     = new Date().toISOString();
    sub.approvedBy     = approvedBy;
    sub.items = (sub.items || []).map((item, i) => ({
      ...item.toObject(),
      userApproved: approvalItems[i]?.approved ?? false,
      userComment:  approvalItems[i]?.comment  ?? '',
    }));

    await project.save();
    res.json(project.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
