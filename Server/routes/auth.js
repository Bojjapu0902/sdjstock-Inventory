const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User       = require('../models/User');
const auth       = require('../middleware/auth');

function makeTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password.trim(), user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = {
      id: user.id, username: user.username, role: user.role,
      name: user.name, projectId: user.projectId,
      email: user.email, phone: user.phone,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: payload, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with that username' });
    if (!user.email) return res.status(400).json({ error: 'No email address on file for this account. Contact an admin.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await User.updateOne({ _id: user._id }, { resetOtp: otp, resetOtpExpiry: expiry });

    const transporter = makeTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SDJ Marine" <${process.env.SMTP_USER}>`,
      to:   user.email,
      subject: 'Your SDJ Marine password reset OTP',
      html: otpEmailHtml(otp, user.username),
    });

    res.json({ message: 'OTP sent', email: user.email.replace(/(.{2}).+(@.+)/, '$1***$2') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP. Check SMTP configuration.' });
  }
});

// POST /api/auth/verify-otp  — confirm OTP is correct before showing new-password form
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;
    if (!username || !otp) return res.status(400).json({ error: 'Username and OTP required' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.resetOtp || user.resetOtp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) return res.status(400).json({ error: 'OTP has expired. Request a new one.' });

    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.resetOtp || user.resetOtp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP' });
    if (!user.resetOtpExpiry || new Date() > user.resetOtpExpiry) return res.status(400).json({ error: 'OTP has expired. Request a new one.' });

    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    await User.updateOne({ _id: user._id }, { password: hashed, resetOtp: null, resetOtpExpiry: null });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/change-password  — verify current password then set new one
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword.trim(), user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    await User.updateOne({ _id: user._id }, { password: hashed });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;