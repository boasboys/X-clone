import express from "express"
import authRoutes from "./routes/auth.routes.js"
import postRoutes from "./routes/post.routes.js"
import dotenv, { parse } from "dotenv"
 import connectMongoDB from "./db/connectMongoDB.js"
 import cookieParser from "cookie-parser"
 import userRoutes from "./routes/user.routes.js"
 import notificationRoutes from "./routes/notification.routes.js"
 import cors from "cors"
  import path from "path"
  import { fileURLToPath } from "url";
  import User from "./models/user.model.js"
 import { v2 as cloudinary } from "cloudinary"
 
 dotenv.config()
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API,
    api_secret:process.env.CLOUD_API_SECRET
})
const app = express()
const URI  = process.env.MONGO_DB_URI
const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
const port = 8004
app.use(cors({
    origin: "http://localhost:3000", // Replace with your frontend's origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.static(path.join(__dirname, "../Frontend/dist" )));

app.use(express.json({limit: "5mb"}))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use("/api/auth",authRoutes)
app.use("/api/user",userRoutes)
app.use("/api/posts",postRoutes)
app.use ("/api/notification",notificationRoutes)
app.get("/test", async (req, res) => {
    try {
      const userId = "6788b547528d9fddc4ef36e7"; // Replace with a valid ObjectId
      console.log("Testing database query for user ID:", userId);
  
      const user = await User.findById(userId);
      console.log("User found:", user);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
  });


  


  (async () => {
    try {
      await connectMongoDB(); // Ensure MongoDB connection is established
      console.log("MongoDB connected successfully.");
  
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      process.exit(1); // Exit process if the database connection fails
    }
  })();
