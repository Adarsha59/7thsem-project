const express = require("express");
const { SerialPort } = require("serialport");
const { ByteLengthParser } = require("@serialport/parser-byte-length");

const app = express();
const port = 3000; // Express server port

// Serial Port Configuration
const serialPort = new SerialPort(
  {
    path: "/dev/ttyACM0", // Ensure this is the correct device path
    baudRate: 9600,
    dataBits: 8,
    parity: "none",
    stopBits: 1,
    autoOpen: false,
  },
  (err) => {
    if (err) {
      console.error("Error opening serial port:", err.message);
    }
  }
);

const parser = new ByteLengthParser({ length: 1 });
serialPort.pipe(parser);

// Open the serial port when the server starts
serialPort.open((err) => {
  if (err) {
    console.error("Error opening the serial port:", err.message);
  } else {
    console.log("Serial Port Opened Successfully!");
  }
});

// Listen for incoming serial data
parser.on("data", (data) => {
  console.log("Received from Serial:", data.toString());
});

// Route to send data to Serial Port
app.get("/send", (req, res) => {
  const message = "Hi From Node.js\n"; // Ensure message ends with newline if needed

  serialPort.write(message, (err) => {
    if (err) {
      console.error("Error writing to serial port:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log("Message Sent Successfully:", message);
    res.json({ success: true, message });
  });
});

// Start Express Server
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
