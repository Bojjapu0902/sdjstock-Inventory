require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const result = await User.updateOne(
    { username: 'sdj' },
    { $set: { email: 'bojjapu.cri@gmail.com' } }
  );

  if (result.matchedCount === 0) {
    console.log('Admin user "sdj" not found.');
  } else {
    console.log('Email updated → bojjapu.cri@gmail.com for user "sdj"');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });