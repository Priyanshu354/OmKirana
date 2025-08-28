const express = require("express");
const jwt = require("jsonwebtoken");
const { verifyRefreshToken } = require("../middleware/authMiddleware");
const router = express.Router();

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "15m"});
}

router.post("/", verifyRefreshToken, (req, res) => {
    //console.log(" hi i am here ");
    const payload = {
        user: {
            id: req.user._id,
            role: req.user.role
        }
    }

    let accessToken;
    try {
        accessToken = generateAccessToken(payload);
        res.status(201).json({ accessToken });
    } catch (error) {
        console.error("Refresh Token Failed", error);
        return res.status(500).json({ message: "Failed to generate access token" });
    }
});

module.exports = router;