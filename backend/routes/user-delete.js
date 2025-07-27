const express = require("express");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

const router = express.Router();

router.delete("/delete/:name", async (req, res) => {
  const { name } = req.params;
  if (!name) {
    return res.status(400).json({ success: false, message: "Name required." });
  }
  try {
    const deletedUser = await User.findOneAndDelete({ name });
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: `User '${name}' not found.` });
    }

    const uploadsDir = path.join(__dirname, "..", "uploads", name);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: `User '${name}' deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
