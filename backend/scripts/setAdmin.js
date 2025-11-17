const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/runmate';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const setAdmin = async () => {
  try {
    await connectDB();

    // Get email from command line arguments
    const email = process.argv[2];

    if (!email) {
      console.error('Please provide an email address');
      console.log('Usage: node setAdmin.js <email>');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Set user as admin
    user.isAdmin = true;
    await user.save();

    console.log(`✓ User ${email} has been set as admin`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  isAdmin: ${user.isAdmin}`);

    process.exit(0);
  } catch (error) {
    console.error('Error setting admin:', error);
    process.exit(1);
  }
};

setAdmin();

