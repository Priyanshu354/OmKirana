const express = require("express");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { registered } = require("../middleware/authMiddleware");

require('dotenv').config();
const router = express.Router();

// Generate a random numeric OTP of a given length
const generateOTP = (len) => {
    let otp = '';
    for (let i = 0; i < len; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

// console.log('EMAIL:', process.env.EMAIL);
// console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    },
});

// Send OTP email using HTML formatting
const sendOTPEmail = async (to, otp) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: 'Verify Your Email - OmKirana',
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="text-align: center; color: #2d3748;">Welcome to <span style="color: #e53e3e;">OmKirana</span>!</h2>
                    <p style="font-size: 16px; color: #4a5568; text-align: center;">To complete your sign-up, please enter the following OTP:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #2b6cb0; text-align: center; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #718096; text-align: center;">This OTP will expire in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #a0aec0; text-align: center;">If you did not request this, please ignore this email.</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #4a5568; text-align: center;">– The OmKirana Team</p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// @route   POST /api/otp/send
// @desc    Send OTP to user's email
// @access  Private
router.post("/send", registered, async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const otp = generateOTP(6);
        const otpExpireAt = Date.now() + 10 * 60 * 1000;

        await User.findOneAndUpdate(
            { email },
            {
                otp: {
                    code: otp,
                    expiresAt: otpExpireAt
                }
            }
        );
        // console.log('EMAIL:', process.env.EMAIL);
        // console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
        await sendOTPEmail(email, otp);
        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Private
router.post("/verify", registered, async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({ message: "No OTP found. Please request a new one." });
        }

        if (user.otp.expiresAt < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        await User.findOneAndUpdate(
            { email },
            {
                isVerified: true,
                $unset: { otp: "" }
            }
        );

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
