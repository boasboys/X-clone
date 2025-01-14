import express from "express"
import protect from "../middleware/protect.js"
import { createPost,deletePost,likeUnLikePost,getAllPosts, commentPost,getAllLikedPosts,getFollowingPosts,getUserPosts} from "../controllers/post.controller.js"
const router = express.Router()
router.get("/all",getAllPosts) 
router.get("/likes/:id",protect,getAllLikedPosts) 
router.get("/following/:id",protect,getFollowingPosts)
router.get("/:id",protect,getUserPosts)
router.post("/createPost",protect, createPost)
 router.post("/like/:id",protect,likeUnLikePost)
 router.post("/comment/:id",protect,commentPost)
 router.delete("/:id",protect,deletePost)
 

//  likeUnLikePost
//  commentPost
//  deletePost
export default router