const express = require("express");
const router = express.Router();
const {
  getLastKey,
  getInputBuffer,
  getEnterPressed,
  clearEnter,
  clearBuffer,
} = require("../config/serial");

router.get("/", (req, res) => {
  res.json({
    success: true,
    lastKey: getLastKey(),
    inputBuffer: getInputBuffer(),
    enterPressed: getEnterPressed(),
  });
});

// Add the missing clear-enter endpoint
router.post("/clear-enter", (req, res) => {
  clearEnter();
  res.json({ success: true });
});

// Optional: Add endpoint to clear buffer
router.post("/clear-buffer", (req, res) => {
  clearBuffer();
  res.json({ success: true });
});

module.exports = router;
