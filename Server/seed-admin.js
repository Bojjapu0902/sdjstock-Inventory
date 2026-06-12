require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'sdj' });
  if (existing) {
    console.log('User "sdj" already exists — resetting password to sdj123@');
    const hashed = await bcrypt.hash('sdj123@', 10);
    await User.updateOne({ username: 'sdj' }, { $set: { password: hashed, role: 'Admin' } });
    console.log('Password reset done.');
  } else {
    const hashed = await bcrypt.hash('sdj123@', 10);
    await User.create({
      id:        'USR-ADMIN-001',
      username:  'sdj',
      password:  hashed,
      role:      'Admin',
      name:      'SDJ Admin',
      projectId: null,
      email:     '',
      phone:     '',
      isActive:  true,
      createdAt: new Date().toISOString().split('T')[0],
    });
    console.log('Admin user "sdj" created successfully.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
