const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kazhuthai';
    console.log(`Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    console.log('--------------------------------------------------');
    console.warn('WARNING: Running in In-Memory/Stateful Mock DB Mode!');
    console.warn('The game will run perfectly using local memory stores.');
    console.warn('MongoDB Atlas is recommended for full production persistence.');
    console.log('--------------------------------------------------');
  }
};

module.exports = connectDB;
