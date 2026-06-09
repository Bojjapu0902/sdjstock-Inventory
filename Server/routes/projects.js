const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Project = require('../models/Project');

router.get('/', auth, async (req, res) => {
  try { res.json(await Project.find({}).lean()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const doc = await Project.create(req.body);
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, __v, ...update } = req.body;
    const doc = await Project.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true }).lean();
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

module.exports = router;