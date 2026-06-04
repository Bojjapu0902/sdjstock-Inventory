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
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
});

module.exports = mongoose.model('User', userSchema);