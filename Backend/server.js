import express from "express"
import authRoutes from "./routes/auth.routes.js"
import postRoutes from "./routes/post.routes.js"
import dotenv, { parse } from "dotenv"
 import connectMongoDB from "./db/connectMongoDB.js"
 import cookieParser from "cookie-parser"
 import userRoutes from "./routes/user.routes.js"
 import notificationRoutes from "../backend/routes/notification.routes.js"
 import cors from "cors"
  import path from "path"
  import { fileURLToPath } from "url";

 import { v2 as cloudinary } from "cloudinary"
 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
 dotenv.config()
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API,
    api_secret:process.env.CLOUD_API_SECRET
})
const app = express()
const URI  = process.env.MONGO_DB_URI

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
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
  });
app.listen(port,()=>
{
    console.log(`Server is running on port ${port} `)
    connectMongoDB()
}
) 

