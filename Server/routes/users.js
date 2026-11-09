const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const auth    = require('../middleware/auth');
const { requireAdmin } = require('../middleware/access');
const User    = require('../models/User');
const Project = require('../models/Project');

const safeUser = ({ password, resetOtp, resetOtpExpiry, resetOtpAttempts, projectId, _id, __v, ...u }) => u;

const SELF_FIELDS  = ['name', 'email', 'phone', 'avatar'];
const ADMIN_FIELDS = [...SELF_FIELDS, 'role', 'isActive'];

// No 0/O or 1/l/I, because admins pass these passwords on by hand.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const PASSWORD_LENGTH = 10;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const sendError = (res, err) => res.status(err.status || 500).json({ error: err.message });

function generatePassword() {
  let out = '';
  for (let i = 0; i < PASSWORD_LENGTH; i++) out += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  return out;
}

async function generateUsername(name) {
  const base = String(name).trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'user';
  for (let i = 0; i < 10; i++) {
    const candidate = `${base}${crypto.randomInt(1000, 10000)}`;
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  throw new HttpError(500, 'Could not generate a unique username. Please try again.');
}

/** Emails receive password OTPs, so each one must be valid and belong to one account. */
async function normaliseEmail(value, ownMongoId = null) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clash = await User.exists({ email: new RegExp(`^${escaped}$`, 'i'), ...(ownMongoId ? { _id: { $ne: ownMongoId } } : {}) });
  if (clash) throw new HttpError(409, `The email "${email}" is already used by another account.`);
  return email;
}

/**
 * Throws unless every project exists and is free or already this user's. Taking a
 * project from someone else is only possible through the project's assignment route.
 */
async function assertAssignable(projectIds, userId) {
  if (!Array.isArray(projectIds)) throw new HttpError(400, 'projectIds must be a list.');
  const wanted = [...new Set(projectIds.map(String))];
  const projects = await Project.find({ id: { $in: wanted } }).select('id name assignedUserId').lean();
  if (projects.length !== wanted.length) throw new HttpError(400, 'One of the selected projects no longer exists.');
  const taken = projects.filter((p) => p.assignedUserId && p.assignedUserId !== userId);
  if (taken.length) {
    throw new HttpError(409, `Already assigned to another user: ${taken.map((p) => p.name).join(', ')}. Change it from Project Assignments.`);
  }
  return wanted;
}

async function setUserProjects(userId, wanted) {
  await Project.updateMany({ assignedUserId: userId, id: { $nin: wanted } }, { $set: { assignedUserId: null } });
  const result = await Project.updateMany(
    { id: { $in: wanted }, assignedUserId: { $in: [null, userId] } },
    { $set: { assignedUserId: userId } }
  );
  if (result.matchedCount !== wanted.length) {
    throw new HttpError(409, 'A selected project was just assigned to someone else. Refresh and try again.');
  }
}

// GET /api/users  — admins get everyone; other users only their own record.
// ProjectsContext loads this for every signed-in user.
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { id: req.user.userId };
    const users = await User.find(filter).lean();
    res.json(users.map(safeUser));
  } catch (err) { sendError(res, err); }
});

// POST /api/users  — the server generates the ID, username and password.
// This response and the reset below are the only times the password is readable.
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role, projectIds = [], isActive } = req.body;
    const fullName = String(name || '').trim();
    if (!fullName) throw new HttpError(400, 'Full name is required.');
    if (role && !['Admin', 'User'].includes(role)) throw new HttpError(400, 'Invalid role.');

    const cleanEmail = await normaliseEmail(email);
    const id = `USR-${Date.now()}`;
    const wanted = role === 'Admin' ? [] : await assertAssignable(projectIds, id);

    const username = await generateUsername(fullName);
    const password = generatePassword();

    const user = await User.create({
      id, username,
      password: await bcrypt.hash(password, 10),
      role: role || 'User',
      name: fullName,
      email: cleanEmail,
      phone: String(phone || '').trim(),
      isActive: isActive !== false,
      createdAt: new Date().toISOString().split('T')[0],
      createdById: req.user.userId,
      createdByName: req.user.name || req.user.username,
    });
    await setUserProjects(id, wanted);

    res.status(201).json({ user: safeUser(user.toObject()), credentials: { id, username, password } });
  } catch (err) { sendError(res, err); }
});

// PUT /api/users/:id  — admins can edit anyone; others only their own profile fields
router.put('/:id', auth, async (req, res) => {
  try {
    const target = await User.findByAnyId(req.params.id);
    if (!target) throw new HttpError(404, 'User not found');

    const isAdmin = req.user.role === 'Admin';
    const isSelf  = String(target._id) === req.user.id;
    if (!isAdmin && !isSelf) throw new HttpError(403, 'You can only edit your own profile.');

    const update = {};
    (isAdmin ? ADMIN_FIELDS : SELF_FIELDS).forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    // An admin can never lock themselves out, which also means there is always
    // at least one active admin left.
    if (isSelf && update.isActive === false) throw new HttpError(400, 'You cannot deactivate your own account.');
    if (isSelf && isAdmin && update.role && update.role !== 'Admin') throw new HttpError(400, 'You cannot remove your own admin role.');
    if (update.role && !['Admin', 'User'].includes(update.role)) throw new HttpError(400, 'Invalid role.');

    if (update.email !== undefined) {
      const email = String(update.email).trim().toLowerCase();
      // OTPs go to this address, so a signed-in user can add one if there is none
      // but only an admin can change it. Otherwise a borrowed session could
      // redirect the password codes to another mailbox.
      if (!isAdmin && target.email && email !== target.email.toLowerCase()) {
        throw new HttpError(403, 'Only an admin can change your email address.');
      }
      if (email || target.email) update.email = await normaliseEmail(email, target._id);
    }

    const becomesAdmin = update.role === 'Admin';
    const wanted = !isAdmin || becomesAdmin || req.body.projectIds === undefined
      ? null
      : await assertAssignable(req.body.projectIds, target.id);
    if (wanted && (update.role || target.role) === 'Admin' && wanted.length) {
      throw new HttpError(400, 'Admins can access every project, so projects are only assigned to users.');
    }

    const user = await User.findOneAndUpdate({ _id: target._id }, { $set: update }, { new: true }).lean();

    // Admins already reach every project, so their assignments are released.
    if (becomesAdmin) await Project.updateMany({ assignedUserId: target.id }, { $set: { assignedUserId: null } });
    else if (wanted) await setUserProjects(target.id, wanted);

    res.json(safeUser(user));
  } catch (err) { sendError(res, err); }
});

// POST /api/users/:id/reset-password  — admin generates a new password for a user
router.post('/:id/reset-password', auth, requireAdmin, async (req, res) => {
  try {
    const target = await User.findOne({ id: req.params.id });
    if (!target) throw new HttpError(404, 'User not found');

    const password = generatePassword();
    await User.updateOne(
      { _id: target._id },
      { password: await bcrypt.hash(password, 10), resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 }
    );
    res.json({ credentials: { id: target.id, username: target.username, password } });
  } catch (err) { sendError(res, err); }
});

// DELETE /api/users/:id  — the user's projects become unassigned; project data stays
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const target = await User.findOne({ id: req.params.id });
    if (!target) throw new HttpError(404, 'User not found');
    if (target.role === 'Admin') throw new HttpError(400, 'Admin accounts cannot be deleted. Change the role to User first.');

    await Project.updateMany({ assignedUserId: target.id }, { $set: { assignedUserId: null } });
    await User.deleteOne({ _id: target._id });
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
