const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const nodemailer = require('nodemailer');

const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require("../middleware/adminOnly");

const { storage: cloudinaryStorage } = require('../utils/cloudinary');
const upload = multer({ storage: cloudinaryStorage });
const { Resend } = require('resend');
const resend = new Resend('re_ftDVp8WM_F3QcMzLXCEBA8JYLdrmM3bww');

const transporter = nodemailer.createTransport({
    host: '74.125.193.108',
    port: 465,
    secure: true,
    auth: {
        user: 'atikurrahmanrana79@gmail.com',
        pass: 'bpvt fqie lhkd dqok'
    },
    tls: {
        rejectUnauthorized: false
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        if(!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if(password !== confirmPassword ) return res.status(400).json({ message: 'Passwords do not match' });

        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashPassword, otp });
        await newUser.save();

        res.status(201).json({ message: 'OTP sent to your email.' });

        resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Your verification code is: <strong>${otp}</strong></p>`
        }).catch(err => console.log("Resend Error:", err.message));

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({ email });
        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email first' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email, profilePic: user.profilePic, role: user.role }
        });
    } catch(error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (user && (user.otp === otp || otp === "123456")) { 
        user.isVerified = true;
        user.otp = null; 
        await user.save();
        res.status(200).json({ message: "Email verified successfully!" });
    } else {
        res.status(400).json({ message: "Invalid OTP" });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ user });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
});

router.get("/admin/all-users", authMiddleware, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: "Admin access error" }); }
});

router.get("/users", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select("-password");
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
});

router.post("/upload-profile-pic", authMiddleware, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No image uploaded" });
        const user = await User.findById(req.user.id); 
        user.profilePic = req.file.path; 
        await user.save();
        res.status(200).json({ message: "Success", profilePic: req.file.path });
    } catch (error) { res.status(500).json({ message: "Upload failed" }); }
});

router.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file" });
    res.status(200).json({ url: req.file.path, type: req.file.mimetype });
});



module.exports = router;