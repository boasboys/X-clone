
import jwt from "jsonwebtoken";
export const generateTokenAndSetCookie = (userId, res) => {
    try {
        if (!userId) {
            throw new Error("User ID is required to generate a token.");
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in the environment variables.");
        }

        console.log("Generating token for User ID:", userId);

        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: "15d",
        });

        console.log("Generated Token:", token);

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("jwt", token, {
            maxAge: 15 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "Strict",
            secure: isProduction,
        });
        // res.setHeader('jwt',token)
    } catch (err) {
        console.error("Error generating token and setting cookie:", err.message);
        throw err;
    }
};