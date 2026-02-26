const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    profilePic: {
        type: String,
        default: ""
    },
        isVerified: {
        type: Boolean, 
        default: false
    },
    otp: String,
},
{ timestamps: true });

module.exports = mongoose.model('User', userSchema);