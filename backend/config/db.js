const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Determine which database to use based on environment
    const isTestEnv = process.env.NODE_ENV === 'test';
    const dbURI = isTestEnv 
      ? process.env.TEST_MONGO_URI 
      : process.env.MONGO_URI;
    
    const conn = await mongoose.connect(dbURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host} (${isTestEnv ? 'Test' : 'Production'} Database)`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 