import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../lib/generateToken.js"
import protect  from "../middleware/protect.js"

const auth = {

   signup: async (req,res)=>
        {
            try {
            const {username,email,password,fullName} = req.body
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
            if(!emailRegex.test(email))
            {
                return res.status(400).json({error: "Invalid email format"})
            }
            const exisitingUser = await User.findOne({username})
            if(exisitingUser)
            {
                return res.status(400).json({error: "Username is already taken"})  
            }
            const existingEmail = await User.findOne({email})
            if(existingEmail)
            {
                return res.status(400).json({error: "Email is alredy taken"})
            }
            if(password.length < 6)
            {
               return  res.status(400).json({error: "Password must have at least 6 characters"})
            }
            
        
        const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password,salt)
    const newUser = new User({
        fullName,
        username,
        email,
        password:hashedPassword
    })
    if(newUser)
    {
        generateTokenAndSetCookie(newUser._id,res)
        await newUser.save()
        res.status(201).json({
            _id: newUser._id,
            FullName: newUser.fullName,
            username:newUser.username,
            email:newUser.email,
            followers:newUser.followers,
            following:newUser.following,
            profileImg:newUser.profileImg,
            coverImg:newUser.coverImg
        })
    }
    else {
        res.status(400).json({error: "Invalid user data"})
    }
    
    }
        catch(err)
        {
        console.log(err.message)
        res.status(500).json({error: "Server internal error"})
        }
        },
       login: async (req,res) =>
            {
               try {
                const {username,password} = req.body
                    const user = await User.findOne({username})  
                   
                    if(!user )
                        {
                            return res.status(400).json({error: "Invalid username"})
                        }   
                        const correctPassword = await bcrypt.compare(password,user?.password || "")
                        if(!correctPassword)
                        {
                            return res.status(400).json({error: "Invalid password"})
                        }
                        generateTokenAndSetCookie(user._id,res)

                        res.status(200).json({
                            _id: user._id,
                            FullName: user.fullName,
                            username:user.username,
                            email:user.email,
                            followers:user.followers,
                            following:user.following,
                            profileImg:user.profileImg,
                            coverImg:user.coverImg
                        })
               } catch (error) {
                console.log(error.message)
                res.status(500).json({error: "Server internal error"})
               }
            },
            logout: async (req,res) =>
                {
                   try {
                    res.clearCookie("jwt")
                    res.status(200).json({message:"User logged out"})
                   } catch (error) {
                    console.log(error.message)
                    res.status(500).json({error: "Server internal error"})
                    
                   }
                    
                   
                },
               server: async (req,res) =>
                    {
                        res.status(200).send('Server is ready')
                    },
                    getMe: async (req,res) =>
                    {
                        try {
                            const user = await User.findById(req.user._id).select("-password")
                            res.status(200).json(user)
                        } catch (error) {
                            console.log(error.message)
                            res.status(500).json({error: "Server internal error"})
                        }
                    }
}
export default auth