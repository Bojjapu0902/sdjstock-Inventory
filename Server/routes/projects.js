const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Project = require('../models/Project');
const Item    = require('../models/InventoryItem');

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Add an 'out' stock record and decrement currentStock. */
async function deductInventoryItem(inv, qty, rate, submissionId, projectId, projectName, adminName, date, time) {
  inv.stockRecords.push({
    id:          `OUT-${submissionId}-${inv.id}`,
    qty,
    rate:        rate || 0,
    supplier:    '',
    timestamp:   new Date().toISOString(),
    date,
    time,
    loggedBy:    adminName || '',
    notes:       `Assigned to project: ${projectName} | Sub: ${submissionId}`,
    direction:   'out',
    projectId,
    projectName,
  });
  inv.currentStock = Math.max(0, (inv.currentStock || 0) - qty);
  await inv.save();
}

/** Remove the matching 'out' record and restore qty to currentStock. */
async function restoreInventoryItem(inv, submissionId, fallbackQty) {
  const recordId     = `OUT-${submissionId}-${inv.id}`;
  const record       = (inv.stockRecords || []).find((r) => r.id === recordId);
  const qtyToRestore = record ? record.qty : fallbackQty;
  inv.stockRecords   = (inv.stockRecords || []).filter((r) => r.id !== recordId);
  inv.currentStock   = (inv.currentStock || 0) + qtyToRestore;
  await inv.save();
}

// ── Stock Received sub-routes ─────────────────────────────────────────────────

// POST /api/projects/:id/stock-received
// Check stock availability → push submission → deduct inventory.
router.post('/:id/stock-received', auth, async (req, res) => {
  try {
    const submission = req.body;
    const reqItems   = submission.items || [];

    // 1. Availability check
    const insufficient = [];
    const invCache = [];

    for (const it of reqItems) {
      const inv = await Item.findOne({ id: it.itemId });
      if (!inv) continue;
      invCache.push({ inv, it });
      if ((inv.currentStock || 0) < it.quantity) {
        insufficient.push({
          itemId:    it.itemId,
          itemName:  it.itemName,
          requested: it.quantity,
          available: inv.currentStock || 0,
          unit:      it.unit,
        });
      }
    }

    if (insufficient.length > 0) {
      return res.status(409).json({ error: 'Insufficient stock', insufficient });
    }

    // 2. Push submission into project
    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.stockReceived.push(submission);
    await project.save();

    // 3. Deduct each item
    for (const { inv, it } of invCache) {
      await deductInventoryItem(
        inv, it.quantity, it.rate,
        submission.id, project.id, project.name,
        submission.adminName, submission.date, submission.time,
      );
    }

    res.status(201).json(project.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/projects/:id/stock-received/:subId
// Replace submission + reconcile inventory (add/restore delta per item).
router.put('/:id/stock-received/:subId', auth, async (req, res) => {
  try {
    const { _id, __v, projectId: _pid, ...update } = req.body;
    const replacement = { ...update, id: update.id || req.params.subId };

    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const oldSub = project.stockReceived.find((s) => s.id === req.params.subId);
    if (!oldSub) return res.status(404).json({ error: 'Submission not found' });

    const newItems = replacement.items || [];
    const oldItems = oldSub.items     || [];

    // Build old-qty lookup
    const oldQtyMap = {};
    for (const oi of oldItems) { oldQtyMap[oi.itemId] = oi.quantity; }

    // Check increases against available stock
    const insufficient = [];
    for (const ni of newItems) {
      const delta = ni.quantity - (oldQtyMap[ni.itemId] || 0);
      if (delta <= 0) continue;
      const inv = await Item.findOne({ id: ni.itemId }).lean();
      if (!inv) continue;
      if ((inv.currentStock || 0) < delta) {
        insufficient.push({
          itemId:    ni.itemId,
          itemName:  ni.itemName,
          requested: ni.quantity,
          available: (inv.currentStock || 0) + (oldQtyMap[ni.itemId] || 0),
          unit:      ni.unit,
        });
      }
    }

    if (insufficient.length > 0) {
      return res.status(409).json({ error: 'Insufficient stock', insufficient });
    }

    // Replace subdoc
    const idx = project.stockReceived.findIndex((s) => s.id === req.params.subId);
    project.stockReceived[idx] = replacement;
    project.markModified('stockReceived');
    await project.save();

    // Reconcile inventory for every affected item
    const allItemIds = new Set([
      ...oldItems.map((i) => i.itemId),
      ...newItems.map((i) => i.itemId),
    ]);

    for (const itemId of allItemIds) {
      const inv    = await Item.findOne({ id: itemId });
      if (!inv) continue;

      const oldQty    = oldQtyMap[itemId] || 0;
      const newIt     = newItems.find((i) => i.itemId === itemId);
      const newQty    = newIt ? newIt.quantity : 0;
      const delta     = newQty - oldQty;
      const recordId  = `OUT-${req.params.subId}-${itemId}`;

      // Remove old 'out' record
      inv.stockRecords = (inv.stockRecords || []).filter((r) => r.id !== recordId);

      if (newQty > 0) {
        // Write fresh 'out' record with updated qty
        inv.stockRecords.push({
          id:          recordId,
          qty:         newQty,
          rate:        newIt ? (newIt.rate || 0) : 0,
          supplier:    '',
          timestamp:   new Date().toISOString(),
          date:        replacement.date || '',
          time:        replacement.time || '',
          loggedBy:    replacement.adminName || '',
          notes:       `Assigned to project: ${project.name} | Sub: ${req.params.subId}`,
          direction:   'out',
          projectId:   req.params.id,
          projectName: project.name,
        });
      }

      // Adjust currentStock: positive delta = deduct more, negative = restore
      inv.currentStock = Math.max(0, (inv.currentStock || 0) - delta);
      await inv.save();
    }

    res.json(project.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id/stock-received/:subId
// Remove submission and restore all items back to inventory.
router.delete('/:id/stock-received/:subId', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sub = project.stockReceived.find((s) => s.id === req.params.subId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Restore inventory before removing
    for (const it of (sub.items || [])) {
      const inv = await Item.findOne({ id: it.itemId });
      if (!inv) continue;
      await restoreInventoryItem(inv, req.params.subId, it.quantity);
    }

    project.stockReceived = project.stockReceived.filter((s) => s.id !== req.params.subId);
    project.markModified('stockReceived');
    await project.save();

    res.json(project.toObject());
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
