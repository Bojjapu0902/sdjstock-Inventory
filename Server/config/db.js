const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // The Atlas user only has access to this database; without it Mongoose falls back to "test".
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'sdjstock' });
    console.log('MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;