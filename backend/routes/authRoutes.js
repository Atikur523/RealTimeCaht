const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require("../middleware/adminOnly");
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const multer = require("multer");
const path = require("path");
const fs = require('fs'); 
const nodemailer = require('nodemailer');
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'atikurrahmanrana79@gmail.com', 
        pass: 'ogwo gcdn oplk oouz'    
    }
});

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if(!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if(password !== confirmPassword ){
            return res.status(400).json({
                message: 'Passwords do not match'
            });
        }

        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({
                message: 'Email already registered'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username: username,
            email,
            password: hashPassword,
            otp: otp
        });
        await newUser.save();

        const mailOptions = {
            from: 'atikurrahmanrana79@gmail.com',
            to: email,
            subject: 'Verify Your Email - MyChatApp',
            text: `Your verification code is: ${otp}`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'OTP sent to your email. Please verify.'
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    };
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
             return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({ 
                message: 'Please verify your email first' 
            });
        }

        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: 'Login successfull',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic 
            }
        });
    }
    catch(error) {
        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');

    if (!user) { 
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      message: 'Server Error',
      error: error.message
    });
  }
});

router.get("/admin-data", authMiddleware, adminOnly, (req, res) => {
    res.json({
        message: "Welcome Admin 🔥",
        secretData: "Only admins can see this"
    });
});

router.post("/upload-profile-pic", authMiddleware, 
    upload.single("image"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profilePic = `http://localhost:3000/uploads/${req.file.filename}`;
        await user.save();

        res.status(200).json({
            message: "Profile picture updated",
            profilePic: user.profilePic
        });

    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
});

router.get("/users", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select("-password -__v");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`; 
    res.status(200).json({ url: fileUrl, type: req.file.mimetype });
  } 
  catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (user && user.otp === otp) {
        user.isVerified = true;
        user.otp = null; 
        await user.save();
        res.status(200).json({ message: "Email verified successfully!" });
    } else {
        res.status(400).json({ message: "Invalid OTP" });
    }
});

module.exports = router;