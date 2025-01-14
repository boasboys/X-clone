// controllers/post.controller.js
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

/**
 * CREATE POST
 * - `username` in `Post` references the poster's user _id
 */
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString(); // from auth middleware

    // Confirm user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Must have either text or image
    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    // If there's an image, upload to Cloudinary
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    // Create new post
    const newPost = new Post({
      username: user._id, // referencing the user's ID (matches your schema)
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error in createPost controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE POST
 * - We compare `post.username` with `req.user._id` 
 *   to ensure the same user is deleting.
 */
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Ensure this user owns the post
    if (post.username.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post" });
    }

    // If post has an image, remove from Cloudinary
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in deletePost controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * COMMENT ON POST
 * - Adds a comment object { user, text } to post.comments.
 */
export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Push the new comment
    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in commentPost controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * LIKE or UNLIKE POST
 * - The `likes` array holds userIds who liked the post.
 */
export const likeUnLikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // UNLIKE
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();

      // If your User model has a likedPosts array, remove postId there as well
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: postId } });

      return res.status(200).json(post.likes);
    } else {
      // LIKE
      post.likes.push(userId);
      await post.save();

      // If your User model has a likedPosts array, add postId there as well
      await User.findByIdAndUpdate(userId, { $push: { likedPosts: postId } });

      // Create a notification
      const notification = new Notification({
        from: userId,
        to: post.username, // The user who created the post
        type: "like",
        
      });
      await notification.save();

      return res.status(200).json(post.likes);
    }
  } catch (error) {
    console.log("Error in likeUnlikePost controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET ALL POSTS
 * - Populates `username` (the user who created the post),
 *   and `comments.user` for each comment.
 */
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "username",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    // If no posts found, return empty array
    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET ALL LIKED POSTS FOR A USER
 * - Expects a userId in req.params.id
 * - Finds all posts whose _id is in the user’s likedPosts array
 */
export const getAllLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({ path: "username", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in getAllLikedPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET FOLLOWING POSTS
 * - Finds all posts where `username` is in `user.following`
 */
export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = user.following;
    // posts where post.username is in array of user IDs the current user follows
    const feedPosts = await Post.find({ username: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({ path: "username", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET POSTS FOR A PARTICULAR USERNAME
 * - Looks up a user by `username` field in User collection
 * - Then finds posts where post.username == user._id
 */
export const getUserPosts = async (req, res) => {
  try {
    const  userId  = req.params.id;
        console.log(req.params)
    // find the user by 'username' field
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // find all posts belonging to that user
    const posts = await Post.find({ username: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "username", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getUserPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};