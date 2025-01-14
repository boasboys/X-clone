 // Adjust the path as necessary
 import { v2 as cloudinary } from "cloudinary";
 import User from '../models/user.model.js'
import Notification from '../models/notification.model.js'
import bcrypt from 'bcryptjs'
 const getProfile = async (req,res) =>
{
    const userId = req.params.id
    try {
        const user = await User.findById(userId).select("-password")
        if(!user)
        {
            return res.status(404).json({error: "User not found"})

        }
        res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({error:"Server internal error"})
    }
}

const followUnfollow = async (req,res) =>
{
    try {
        const {id} = req.params
        const userToModify = await User.findById(id)
        const currentUser = await User.findById(req.user._id)
        if(!userToModify || !currentUser)
        {
            return res.status(404).json({error: "User not found"})
        }
        if(id == req.user._id)
        {
            return res.status(400).json({error: 'you cannot folow/unfollow yourself'})
        }
        const isFollowing = currentUser.following.includes(id)
        if(isFollowing)
        {
             await User.findByIdAndUpdate(id,{$pull:{followers:req.user._id}})
             await User.findByIdAndUpdate(req.user._id,{$pull:{following:id}})
           return res.status(200).json({message: "successfully unfollowed user"})
        }
          else {
             await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}})
             await User.findByIdAndUpdate(req.user._id,{$push:{following:id}})
                return res.status(200).json({message: "successfully followed user"})
        }
        const notification = new Notification({
            type: isFollowing ? "unfollow" : "follow",
            from:req.user.id,
            to:id
        })
        await notification.save()
    } 
    catch (error) {
        return res.status(500).json({error:"Server internal error"})    
    }
    
}
const suggesstedUsers = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Step 1: Fetch the following list of the current user
      const currentUser = await User.findById(userId).select("following");
  
      // Step 2: Fetch users followed by people the user follows (friends of friends)
      const friendsOfFriends = await User.aggregate([
        { $match: { _id: { $in: currentUser.following } } },
        { $lookup: { 
            from: "users", 
            localField: "following", 
            foreignField: "_id", 
            as: "friendsOfFriends" 
        }},
        { $unwind: "$friendsOfFriends" },
        { $replaceRoot: { newRoot: "$friendsOfFriends" } }, // Flatten the result
        { $match: { _id: { $ne: userId } } }, // Exclude the current user
      ]);
  
      // Step 3: Exclude users already followed
      const uniqueUsers = new Map(); // Use Map to handle uniqueness
      friendsOfFriends.forEach(user => {
        if (!currentUser.following.includes(user._id.toString())) {
          uniqueUsers.set(user._id.toString(), user); // Add user to Map
        }
      });
  
      // Step 4: Add relevance sorting (optional)
      const relevantUsers = Array.from(uniqueUsers.values()).slice(0, 5); // Get top 10
  
      // Step 5: Format the response
      const suggestions = relevantUsers.map(user => ({
        id:user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        fullname: user.fullname,
        profileImg:user.img
      }));
  
      // Send response
      res.status(200).json({ suggestions });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Server internal error" });
    }
  };
  const updateProfile = async (req, res) => {
    const {
      fullName,
      username,
      email,
      currentPassword,
      newPassword,
      bio,
      link,
    } = req.body;
  
    let { profileImg, coverImg } = req.body; 
    const userId = req.user._id; // you get this from the decoded token
  
    try {
      // 1) Make sure user exists
      let user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // 2) Handle password changes if present
      if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
        return res
          .status(400)
          .json({ error: "Please provide both current password and new password" });
      }
  
      if (currentPassword && newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
        if (newPassword?.length < 6) {
          return res
            .status(400)
            .json({ error: "Password must be at least 6 characters long" });
        }
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
      }
  
      // 3) Handle profile image if sent
      if (profileImg) {
        // If user had an old image, destroy it
        if (user.profileImg) {
          await cloudinary.uploader.destroy(
            user.profileImg.split("/").pop().split(".")[0]
          );
        }
        const uploadedResponse = await cloudinary.uploader.upload(profileImg);
        profileImg = uploadedResponse.secure_url;
      }
  
      // 4) Handle cover image if sent
      if (coverImg) {
        if (user.coverImg) {
          await cloudinary.uploader.destroy(
            user.coverImg.split("/").pop().split(".")[0]
          );
        }
        const uploadedResponse = await cloudinary.uploader.upload(coverImg);
        coverImg = uploadedResponse.secure_url;
      }
  
      // 5) Update any text fields if present
      user.fullName = fullName || user.fullName;
      user.email = email || user.email;
      user.username = username || user.username;
      user.bio = bio || user.bio;
      user.link = link || user.link;
  
      // 6) Update any new images if present
      user.profileImg = profileImg || user.profileImg;
      user.coverImg = coverImg || user.coverImg;
  
      // 7) Save and respond
      user = await user.save();
      user.password = null; // do not return the hashed password
      return res.status(200).json(user);
    } catch (error) {
      console.log("Error in updateUser: ", error.message);
      res.status(500).json({ error: error.message });
    }
  };

export {getProfile,followUnfollow,suggesstedUsers,updateProfile}