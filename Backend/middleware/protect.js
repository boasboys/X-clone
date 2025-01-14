import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protect = async (req, res, next) => {
    try {
        let token = req.cookies.jwt;
        console.log("Cookies:", req.cookies); // Log all cookies
        console.log("JWT Token from Cookie:", token);

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
                console.log("JWT Token from Authorization Header:", token);
            }
        }

        if (!token) {
            return res.status(401).json({ error: "Not authorized, no token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded.id);

        req.user = await User.findById(decoded.id).select("-password");
        console.log("User Found:", req.user);

        if (!req.user) {
            return res.status(401).json({ error: "Not authorized, user not found" });
        }

        next();
    } catch (error) {
        console.error("Protect Middleware Error:", error.message);
        res.status(500).json({ error: "Server internal error" });
    }
};

export default protect;