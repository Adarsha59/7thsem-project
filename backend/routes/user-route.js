const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const username = req.body.name;
    if (!username) return cb(new Error("Username is required"));
    const uploadPath = path.join(__dirname, "..", "uploads", username);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Check if user exists
router.get("/check-name", async (req, res) => {
  const { name } = req.query;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Name query is required" });

  try {
    const existingUser = await User.findOne({ name });
    res.json({ exists: !!existingUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Register user
router.post("/register", upload.array("images", 3), async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name and password required." });
    }
    if (!/^\d{5}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be exactly 5 digits (numbers only).",
      });
    }
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists." });
    }
    if (!req.files || req.files.length !== 3) {
      return res
        .status(400)
        .json({ success: false, message: "Exactly 3 images required." });
    }

    const uploadPath = path.join(__dirname, "..", "uploads", name);
    req.files.forEach((file, i) => {
      const newFilename = path.join(uploadPath, `${i + 1}.png`);
      fs.renameSync(file.path, newFilename);
    });

    const newUser = new User({ name, password, imagePath: `/uploads/${name}` });
    await newUser.save();

    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
});

// List all users (names only)
router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "name");
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// GET /api/users/labels
router.get("/labels", async (req, res) => {
  try {
    const users = await User.find({}, "name"); // get all users' names

    // Map to { name, imageUrl } for the first image only (1.png)
    const labels = users.map(({ name }) => ({
      name,
      imageUrl: `/uploads/${encodeURIComponent(name)}/1.png`, // make sure frontend can access this path
    }));

    res.json({ success: true, labels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/verify-password", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Name and password required" });
  }

  try {
    const user = await User.findOne({ name });
    if (user && user.password === password) {
      // In real app, compare hashed password instead
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (err) {
    console.error("Password verification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
