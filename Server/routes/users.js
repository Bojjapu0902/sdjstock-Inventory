const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth   = require('../middleware/auth');
const User   = require('../models/User');

const safeUser = ({ password, resetOtp, resetOtpExpiry, resetOtpAttempts, _id, __v, ...u }) => u;

const SELF_FIELDS  = ['name', 'email', 'phone', 'avatar'];
const ADMIN_FIELDS = [...SELF_FIELDS, 'username', 'password', 'role', 'projectId', 'isActive'];

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// GET /api/users  — every signed-in user's ProjectsContext loads this list
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}).lean();
    res.json(users.map(safeUser));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { username, password, role, name, projectId, email, phone, isActive } = req.body;
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
      isActive: isActive !== false,
      createdAt: new Date().toISOString().split('T')[0],
    });
    res.status(201).json(safeUser(user.toObject()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/:id  — admins can edit anyone; others only their own profile fields
router.put('/:id', auth, async (req, res) => {
  try {
    const target = await User.findByAnyId(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const isAdmin = req.user.role === 'Admin';
    const isSelf  = String(target._id) === String(req.user.id) || target.id === req.user.id;
    if (!isAdmin && !isSelf) return res.status(403).json({ error: 'You can only edit your own profile.' });

    const update = {};
    (isAdmin ? ADMIN_FIELDS : SELF_FIELDS).forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    if (update.password) {
      update.password = await bcrypt.hash(update.password.trim(), 10);
    } else {
      delete update.password;
    }

    const user = await User.findOneAndUpdate({ _id: target._id }, { $set: update }, { new: true }).lean();
    res.json(safeUser(user));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await User.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
