const { SerialPort } = require("serialport");
const { ByteLengthParser } = require("@serialport/parser-byte-length");

const serialPort = new SerialPort(
  {
    path: "/dev/ttyACM0", // Ensure this is correct
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

let lastReceivedData = ""; // Store last received data

// Listen for incoming serial data
// parser.on("data", (data) => {
//   lastReceivedData += data.toString();
//   console.log("Received from Serial:", lastReceivedData);
// });

serialPort.open((err) => {
  if (err) {
    console.error("Error opening serial port:", err.message);
  } else {
    console.log("Serial Port Opened Successfully!");
  }
});
// console.log("object received:", newdata);
module.exports = { serialPort, lastReceivedData };
