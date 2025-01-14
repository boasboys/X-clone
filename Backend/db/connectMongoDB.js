import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
// nothing
const connectMongoDB = async () => {
    try {
        const MONGO_DB_URI = process.env.MONGO_DB_URI;
        if (!MONGO_DB_URI) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }

        console.log('Mongo URI:', MONGO_DB_URI); // Debug log
        
        const conn = await mongoose.connect(MONGO_DB_URI)
        
        console.log(`MongoDB connected: ${conn.connection.host}`);
        
        // Monitor for errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });
        
    } catch (error) {
        console.error('MongoDB connection error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            // Log additional details if they exist
            ...(error.reason && { reason: error.reason })
        });
        process.exit(1);
    }
};

export default connectMongoDB;