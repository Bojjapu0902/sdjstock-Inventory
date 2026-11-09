const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  username:  { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['Admin', 'User'], default: 'User' },
  name:      { type: String, default: '' },
  projectId: { type: String, default: null },
  email:     { type: String, default: '' },
  phone:     { type: String, default: '' },
  avatar:         { type: String, default: '' },
  isActive:       { type: Boolean, default: true },
  createdAt:      { type: String, default: () => new Date().toISOString().split('T')[0] },
  resetOtp:       { type: String, default: null },
  resetOtpExpiry: { type: Date,   default: null },
  resetOtpAttempts: { type: Number, default: 0 },
});

// Look up by the app's "USR-..." id or by Mongo _id. Tokens carry _id; the
// client and the admin panel use id.
userSchema.statics.findByAnyId = function (id) {
  const or = [{ id: String(id) }];
  if (mongoose.isObjectIdOrHexString(id)) or.push({ _id: id });
  return this.findOne({ $or: or });
};

module.exports = mongoose.model('User', userSchema);