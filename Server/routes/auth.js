const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User       = require('../models/User');
const auth       = require('../middleware/auth');

const OTP_TTL_MS       = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_CLEARED      = { resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 };

function makeTransporter() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
    connectionTimeout: 15000,
    greetingTimeout:   15000,
    socketTimeout:     20000,
  });
}

function otpEmailHtml(otp, username) {
  return `
  <div style="font-family:'Inter',sans-serif;max-width:480px;margin:0 auto;background:#F8FAFC;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1E1B4B,#3730A3);padding:32px 36px;text-align:center">
      <div style="font-size:28px;margin-bottom:8px">🔐</div>
      <div style="font-size:20px;font-weight:800;color:#fff">Password Reset</div>
      <div style="font-size:13px;color:rgba(199,210,254,0.75);margin-top:4px">SDJ Marine Inventory</div>
    </div>
    <div style="padding:32px 36px">
      <p style="font-size:14px;color:#475569;margin:0 0 20px">Hi <strong>${username}</strong>, use the OTP below to reset your password. It expires in <strong>15 minutes</strong>.</p>
      <div style="background:#EEF2FF;border:2px dashed #818CF8;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#4F46E5">${otp}</div>
      </div>
      <p style="font-size:12px;color:#94A3B8;margin:0">If you did not request this, ignore this email. Your password will not change.</p>
    </div>
  </div>`;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const sendError = (res, err) => res.status(err.status || 500).json({ error: err.message });

/**
 * The forgot-password flow accepts a username or an email at every step.
 * Emails are matched case-insensitively because they are stored as typed.
 */
async function findByIdentifier(identifier) {
  const val = String(identifier || '').trim().toLowerCase();
  if (!val) return null;

  const byUsername = await User.findOne({ username: val });
  if (byUsername || !val.includes('@')) return byUsername;

  const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = await User.find({ email: new RegExp(`^${escaped}$`, 'i') }).limit(2);
  if (matches.length > 1) {
    throw new HttpError(409, 'More than one account uses this email. Please enter your username instead.');
  }
  return matches[0] || null;
}

/** Throws if the OTP is not valid. Wrong guesses count, and too many burn the OTP. */
async function assertValidOtp(user, otp) {
  if (!user.resetOtp || !user.resetOtpExpiry) {
    throw new HttpError(400, 'No active OTP for this account. Request a new one.');
  }
  if (new Date() > user.resetOtpExpiry) {
    throw new HttpError(400, 'OTP has expired. Request a new one.');
  }
  if (user.resetOtp === String(otp).trim()) return;

  const updated = await User.findOneAndUpdate(
    { _id: user._id },
    { $inc: { resetOtpAttempts: 1 } },
    { new: true }
  );
  const remaining = OTP_MAX_ATTEMPTS - updated.resetOtpAttempts;
  if (remaining <= 0) {
    await User.updateOne({ _id: user._id }, OTP_CLEARED);
    throw new HttpError(400, 'Too many incorrect attempts. Request a new OTP.');
  }
  throw new HttpError(400, `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password.trim(), user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.isActive === false) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact an admin.' });
    }

    // Keep the token small: it is sent as a header on every request, and an
    // avatar image in here would push it past the server's header size limit.
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        projectId: user.projectId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        projectId: user.projectId,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  let otpStoredFor = null;
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username or email is required' });

    const user = await findByIdentifier(username);
    if (!user) return res.status(404).json({ error: 'No account found with that username or email' });
    if (user.isActive === false) return res.status(403).json({ error: 'This account has been deactivated. Contact an admin.' });
    if (!user.email) return res.status(400).json({ error: 'No email address on file for this account. Contact an admin.' });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[forgot-password] SMTP_USER / SMTP_PASS are not set on the server');
      return res.status(503).json({ error: 'Email service is not configured on the server. Contact an admin.' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await User.updateOne(
      { _id: user._id },
      { resetOtp: otp, resetOtpExpiry: new Date(Date.now() + OTP_TTL_MS), resetOtpAttempts: 0 }
    );
    otpStoredFor = user._id;

    await makeTransporter().sendMail({
      from: process.env.SMTP_FROM || `"SDJ Marine" <${process.env.SMTP_USER}>`,
      to:   user.email,
      subject: 'Your SDJ Marine password reset OTP',
      html: otpEmailHtml(otp, user.username),
    });

    res.json({ message: 'OTP sent', email: user.email.replace(/(.{2}).+(@.+)/, '$1***$2') });
  } catch (err) {
    if (err.status) return sendError(res, err);

    // Nobody received this OTP, so don't leave it valid.
    if (otpStoredFor) await User.updateOne({ _id: otpStoredFor }, OTP_CLEARED).catch(() => {});
    console.error('[forgot-password] send failed:', err.code, err.message);
    res.status(502).json({
      error: `Could not send the OTP email${err.code ? ` (${err.code})` : ''}. Please try again or contact an admin.`,
    });
  }
});

// POST /api/auth/verify-otp  — confirm OTP is correct before showing new-password form
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;
    if (!username || !otp) return res.status(400).json({ error: 'Username and OTP required' });

    const user = await findByIdentifier(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await assertValidOtp(user, otp);
    res.json({ valid: true });
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });

    const password = String(newPassword).trim();
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await findByIdentifier(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await assertValidOtp(user, otp);

    const hashed = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: user._id }, { password: hashed, ...OTP_CLEARED });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    sendError(res, err);
  }
});

// PUT /api/auth/change-password  — verify current password then set new one
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });

    const password = String(newPassword).trim();
    if (password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findByAnyId(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(String(currentPassword).trim(), user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: user._id }, { password: hashed, ...OTP_CLEARED });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByAnyId(req.user.id)
      .select('-password -resetOtp -resetOtpExpiry -resetOtpAttempts');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
