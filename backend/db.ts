// db.ts - MongoDB connection using Mongoose
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studybuddy';

export const connectDB = async () => {
    try {
        const masked = MONGODB_URI.replace(/:([^@@]+)@/, ':****@');
        console.log(`🔌 Connecting to MongoDB: ${masked}`);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
