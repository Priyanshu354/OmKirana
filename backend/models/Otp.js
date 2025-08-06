const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    otp: { 
        type: String,
        required: true,
    },
    otpExpire: {
        type: Date,
        required: true,
    },
    context: {
        type: String,
        enum: ['email_verification', 'password_reset'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    }
});

module.exports = mongoose.model('Otp', otpSchema);