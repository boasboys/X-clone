import mongoose from "mongoose";
import dotenv from "dotenv";
import Notification from "./models/notification.model.js";

dotenv.config();

const testQuery = async () => {
  
  try {
    const uri = "mongodb+srv://boasboys:terminal123@cluster1.sofa1.mongodb.net/twitter?retryWrites=true&w=majority&appName=Cluster1"
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // Wait for up to 30 seconds
    });
    console.log("Connected to MongoDB");

    const notifications = await Notification.find({ to: "6788b547528d9fddc4ef36e7" }); // Replace with a valid user ID
    console.log("Notifications found:", notifications);

    if (!notifications || notifications.length === 0) {
      console.log("No notifications found.");
    }
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
  } finally {
    mongoose.disconnect();
  }
};

