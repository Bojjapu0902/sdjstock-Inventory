const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Supplier = require('../models/Supplier');

router.get('/', auth, async (req, res) => {
  try { res.json(await Supplier.find({}).lean()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const doc = await Supplier.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const doc = await Supplier.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Supplier not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Supplier.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;