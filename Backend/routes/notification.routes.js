import express from "express"
import protect from "../middleware/protect.js"
import { getNotifications,deleteNotifications } from "../controllers/notification.controller.js"
import Notification from "../models/notification.model.js"
import Post from "../models/post.model.js"

const router = express.Router()


router.get("/debug", async (req, res)=>{
    try {
        const data = await Post.find();
        res.json({data});
    } catch(e){
        res.json({e});
        throw e;
    }
});
router.get("/",protect,getNotifications)
router.delete("/",protect,deleteNotifications)
// router.delete("/:id",protect,deleteOneNotification)








export default router