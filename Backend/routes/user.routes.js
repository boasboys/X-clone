import express from 'express';
import protect from '../middleware/protect.js';
import { followUnfollow, getProfile, suggesstedUsers, updateProfile } from '../controllers/user.controller.js';
const router = express.Router()

router.get("/profile/:id",getProfile)

router.get("/suggested",protect,suggesstedUsers)
router.post("/follow/:id",protect,followUnfollow)
router.post("/update",protect,updateProfile)




export default router;