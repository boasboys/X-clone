import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectMongoDB = async () => {
  try {
    const MONGO_DB_URI = process.env.MONGO_DB_URI;

    if (!MONGO_DB_URI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    console.log("Attempting to connect to MongoDB...");
    console.log("Mongo URI:", MONGO_DB_URI);

    // Create a MongoDB client connection with the Stable API version settings
    const conn = await mongoose.connect(MONGO_DB_URI, {
      serverApi: {
        version: "1", // Stable API Version 1
        strict: true, // Enforce strict behavior
        deprecationErrors: true, // Enable deprecation warnings
      },
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
    });

    console.log(`MongoDB connected successfully: ${conn.connection.host}`);

    // Event listeners for connection
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connection established.");
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB connection disconnected.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
  } catch (error) {
    console.error("MongoDB connection error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      ...(error.reason && { reason: error.reason }), // Log additional details if available
    });
    process.exit(1); // Exit process on connection failure
  }
};

export default connectMongoDB;