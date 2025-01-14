import Notification from "../models/notification.model.js"

export const getNotifications = async (req,res) =>
{
    try {
        
    
    const userId = req.user._id
    const notifications = await Notification.find({to:userId}).populate({
        path: "from",
        select: "username profileImg"


    }
    )

    if(!notifications)
        {
            res.status(404).json({error: " Notification Not found"})
        }

       await Notification.updateMany({to:userId},{read:true})
       res.status(200).json(notifications)
    } catch (error) {
        res.status(500).json({error:"Internal Error"})
    }
    
}
export const deleteNotifications = async (req,res) =>
{
    try {
        const userId = req.user._id
        await Notification.deleteMany({to:userId})
        res.status(200).json({"message": "You successfully delted your Notifications"})


    } catch (error) {
        res.status(500).json({error:"Internal Error"})
    }
}
 export const deleteOneNotification = async (req,res) =>
 {
    try {
        const notificationId = req.params
        const userId = req.user._id
        const notification = Notification.findById(notificationId)
        if(!notification)
        {
            res.status(404).json({error: "Notification not found"})
        }
        if(notification.to.toString() !== userId.toString())
        {
            return res.status(403).json("Unauthorized request")
        }

    } catch (error) {
         res.status(500).json({error:"Internal Error"})
    }
 }