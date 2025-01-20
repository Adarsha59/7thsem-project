const express = require("express");
const { serialPort } = require("../config/serial");

const router = express.Router();

// Route to control LED via POST request
router.post("/", (req, res) => {
  const { signal } = req.body; // Corrected JSON extraction

  console.log("Received Signal:", signal);

  if (signal !== "1" && signal !== "0") {
    return res.status(400).json({
      success: false,
      message: "Invalid signal. Use '1' to turn ON and '0' to turn OFF.",
    });
  }

  serialPort.write(signal, (err) => {
    if (err) {
      console.error("Error writing to serial port:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log(`Sent LED Command: ${signal}`);
    res.json({
      success: true,
      message: `LED ${signal === "1" ? "ON" : "OFF"}`,
    });
  });
});

module.exports = router;
