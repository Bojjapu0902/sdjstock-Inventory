const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  username:  { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['Admin', 'User'], default: 'User' },
  name:      { type: String, default: '' },
  email:     { type: String, default: '' },
  phone:     { type: String, default: '' },
  avatar:         { type: String, default: '' },
  isActive:       { type: Boolean, default: true },
  createdAt:      { type: String, default: () => new Date().toISOString().split('T')[0] },
  // The admin who created this account. The name is kept as it was at the time, so
  // it still reads correctly if that admin is later renamed or removed.
  createdById:    { type: String, default: '' },
  createdByName:  { type: String, default: '' },
  resetOtp:      { type: String, default: null },
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