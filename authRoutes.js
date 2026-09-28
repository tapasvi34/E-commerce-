const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const existingUser = await User.findOne({ email }); //check is email already registered
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); //scramble password 10 times..?
    const user = new User({
      email,
      password: hashedPassword,
      username: username || "PLAYER_ONE"
    });

    const savedUser = await user.save();
    res.json({ 
      success: true, 
      userId: savedUser._id, 
      message: "User registered successfully!" 
    }); //send unique ID back to browser localstorage
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    res.json({ 
      success: true, 
      userId: user._id, 
      username: user.username,
      message: "Login successful 🎉" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

module.exports = router;