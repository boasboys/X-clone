import express from "express"
import protect from "../middleware/protect.js"
import { getNotifications,deleteNotifications,deleteOneNotification } from "../controllers/notification.controller.js"
const router = express.Router()

router.get("/",protect,getNotifications)
router.delete("/",protect,deleteNotifications)
router.delete("/:id",protect,deleteOneNotification)








export default router