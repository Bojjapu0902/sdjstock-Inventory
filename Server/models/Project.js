const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  location:    { type: String, default: '' },
  address:     { type: String, default: '' },
  status:      { type: String, default: 'Active' },
  manager:     { type: String, default: '' },
  phone:       { type: String, default: '' },
  email:       { type: String, default: '' },
  description: { type: String, default: '' },
  username:    { type: String, default: '' },
  password:    { type: String, default: '' },
  capacity:    { type: String, default: '' },
  createdAt:   { type: String, default: () => new Date().toISOString().split('T')[0] },
});

module.exports = mongoose.model('Project', projectSchema);