import express from "express"
import auth from "../controllers/auth.controller.js"
import  protect from "../middleware/protect.js"
const router = express.Router()

router.post("/signup",auth.signup)
router.post("/login",auth.login) 
    router.post("/logout",auth.logout)
    router.get("/",auth.server)
router.get("/me",protect,auth.getMe)

export default router