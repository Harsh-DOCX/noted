const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    recoveryQuestion: {
        type: String,
        required: true
    },
    recoveryAnswer: {
        type: String,
        required: true,
        select: false
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);