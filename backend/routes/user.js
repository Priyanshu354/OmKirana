const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

require("dotenv").config();

const router = express.Router();

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post("/register", async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
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

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "24h" },
            (err, token) => {
                if (err) throw err;

                res.status(201).json({
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    },
                    token
                });
            }
        );
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

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "24h" },
            (err, token) => {
                if (err) throw err;

                res.status(200).json({
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    },
                    token
                });
            }
        );
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
