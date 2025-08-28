const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

require("dotenv").config();

const router = express.Router();

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "15m"});
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "7d"});
}



// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post("/register", async (req, res) => {
    const { name, email, phone, password } = req.body;
    let {role} = req.body;
    
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        if(!role){
            role = "customer";
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role
        });

        await user.save();

        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        let accessToken, refreshToken;

        try {
            accessToken = generateAccessToken(payload);
            refreshToken = generateRefreshToken(payload);
        } catch (error) {
            return res.status(500).json({ message: "Failed to generate tokens" });
        }

        res.cookie("refreshToken", refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/users/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
    const { email, phone, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.isVerified === false) {
            return res.status(400).json({ message: "User is not verified" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        let accessToken, refreshToken;

        try {
            accessToken = generateAccessToken(payload);
            refreshToken = generateRefreshToken(payload);
        } catch (error) {
            return res.status(500).json({ message: "Failed to generate tokens" });
        }

        res.cookie("refreshToken", refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
