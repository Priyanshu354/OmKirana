const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        sparse: true,
        unique: true, 
    },
    phone: {
        type: String,
        required: true,
        sparse: true,
        unique: true, 
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    isVerified: { 
        type: Boolean, 
        default: false
    },
    otp: { 
        code: String,
        expiresAt: Date
    },
    role: {
        type : String, 
        enum : ["customer", "admin"],
        default : "customer",
    }
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);