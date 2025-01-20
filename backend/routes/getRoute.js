const express = require("express");
const { lastReceivedData } = require("../config/serial");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("data=", lastReceivedData);
  if (lastReceivedData) {
    res.json({ success: true, receivedData: lastReceivedData });
  } else {
    res.json({ success: false, message: "No data received yet." });
  }
});

module.exports = router;
