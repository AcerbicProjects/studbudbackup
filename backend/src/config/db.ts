import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[DATABASE] MongoDB disconnected. Reconnecting...');
    });

    await mongoose.connect(connString);
    console.log('[DATABASE] MongoDB Connected successfully.');
  } catch (error) {
    console.error('[DATABASE] Initial connection failed. Express server will remain online:', error);
  }
};

export default connectDB;
