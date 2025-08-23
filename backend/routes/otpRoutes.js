const express = require("express");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { verifyResetToken } = require("../middleware/authMiddleware");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


require("dotenv").config();

const router = express.Router();

// Generate numeric OTP
const generateOTP = (len) => {
    let otp = '';
    for (let i = 0; i < len; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
});

// Send Email for Email Verification
const sendOTPEmail = async (to, otp) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: "Verify Your Email - OmKirana",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="text-align: center;">Welcome to <span style="color: #e53e3e;">OmKirana</span></h2>
                <p style="text-align: center;">Use this OTP to verify your email:</p>
                <h1 style="text-align: center; color: #2b6cb0;">${otp}</h1>
                <p style="text-align: center;">Expires in 10 minutes.</p>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

// Send Email for Forgot Password
const sendForgotPasswordOTPEmail = async (to, otp) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: "Reset Your Password - OmKirana",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="text-align: center;">Reset Password for <span style="color: #e53e3e;">OmKirana</span></h2>
                <p style="text-align: center;">Use this OTP to reset your password:</p>
                <h1 style="text-align: center; color: #2b6cb0;">${otp}</h1>
                <p style="text-align: center;">Expires in 10 minutes.</p>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

// @route   POST /api/auth/send-otp
// @desc    Send OTP for email verification
// @access  Public
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const otp = generateOTP(6);
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        const otpExpire = Date.now() + 10 * 60 * 1000;

        await Otp.deleteMany({ userId: user._id });

        await Otp.create({
            userId: user._id,
            otp: hashedOtp,
            otpExpire,
            context: "email_verification",
        });

        await sendOTPEmail(email, otp);
        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
// @access  Public
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        const otpRecord = await Otp.findOne({
            userId: user._id,
            otp: hashedOtp,
            otpExpire: { $gt: Date.now() },
            context: "email_verification",
        });

        if (!otpRecord) return res.status(400).json({ message: "Invalid or expired OTP" });

        await User.findByIdAndUpdate(user._id, { isVerified: true });
        await Otp.deleteMany({ userId: user._id });

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/auth/send-reset-otp
// @desc    Send OTP for password reset
// @access  Public
router.post("/send-reset-otp", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const otp = generateOTP(6);
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        const otpExpire = Date.now() + 10 * 60 * 1000;

        await Otp.deleteMany({ userId: user._id });

        await Otp.create({
            userId: user._id,
            otp: hashedOtp,
            otpExpire,
            context: "password_reset",
        });

        await sendForgotPasswordOTPEmail(email, otp);
        return res.status(200).json({ message: "Reset OTP sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/auth/verify-reset-otp
// @desc    Verify OTP for password reset and issue token
// @access  Public
router.post("/verify-reset-otp", async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        const otpRecord = await Otp.findOne({
            userId: user._id,
            otp: hashedOtp,
            otpExpire: { $gt: Date.now() },
            context: "password_reset",
        });

        if (!otpRecord) return res.status(400).json({ message: "Invalid or expired OTP" });

        await Otp.deleteMany({ userId: user._id });

        const payload = {
            userId: user._id,
            purpose: "password_reset",
        };

        const resetToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });

        return res.status(200).json({ token: resetToken });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset forget password
// @access  Private
router.post("/reset-password", verifyResetToken, async (req, res) => {
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(400).json({ message: "User not found" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
