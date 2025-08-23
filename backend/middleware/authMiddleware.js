const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification error:", error.message);
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

const verifyResetToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.purpose !== "password_reset") {
            return res.status(403).json({ message: "Invalid token purpose" });
        }

        req.user = { _id: decoded.userId };
        next();
    } catch (error) {
        console.error("Reset token error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const verifyRefreshToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        if(!refreshToken){
            return res.status(400).json({message: "No token, authorization denied"})
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
    } catch (error) {
        console.error("JWT verification error:", error.message);
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};
module.exports = { protect, verifyResetToken, verifyRefreshToken };
