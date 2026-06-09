const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth   = require('../middleware/auth');
const User   = require('../models/User');

const safeUser = ({ password, _id, __v, ...u }) => u;

// GET /api/users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}).lean();
    res.json(users.map(safeUser));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users
router.post('/', auth, async (req, res) => {
  try {
    const { username, password, role, name, projectId, email, phone } = req.body;
    const uname = username?.trim().toLowerCase();
    if (!uname || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const exists = await User.findOne({ username: uname });
    if (exists) return res.status(409).json({ error: `Username "${uname}" is already taken.` });

    const hashed = await bcrypt.hash(password.trim(), 10);
    const id = `USR-${Date.now()}`;
    const user = await User.create({
      id, username: uname, password: hashed,
      role: role || 'User', name: name?.trim() || uname,
      projectId: role === 'Admin' ? null : (projectId?.trim() || null),
      email: email?.trim() || '', phone: phone?.trim() || '',
      createdAt: new Date().toISOString().split('T')[0],
    });
    res.status(201).json(safeUser(user.toObject()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, __v, ...update } = req.body;
    if (update.password) {
      update.password = await bcrypt.hash(update.password.trim(), 10);
    } else {
      delete update.password;
    }
    const user = await User.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(user));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await User.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;