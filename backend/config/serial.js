const { SerialPort } = require("serialport");
const { ByteLengthParser } = require("@serialport/parser-byte-length");

const serialPort = new SerialPort({
  path: "/dev/ttyACM0",
  baudRate: 9600,
});

const parser = new ByteLengthParser({ length: 1 });
serialPort.pipe(parser);

let lastKey = "";
let inputBuffer = "";
let enterPressed = false;

parser.on("data", (data) => {
  const key = data.toString().trim();
  if (!key) return;

  lastKey = key;
  console.log("Keypad Key Received:", key);

  if (key === "*" || key === "#") {
    console.log("Clear input buffer.");
    inputBuffer = "";
    enterPressed = false; // Also clear enter flag when clearing
  } else if (key.toUpperCase() === "D") {
    console.log("ENTER key pressed.");
    enterPressed = true;
    // Don't clear the buffer yet — let frontend grab it.
  } else {
    inputBuffer += key;
  }
});

serialPort.on("open", () => {
  console.log("Serial Port Opened Successfully!");
});

serialPort.on("error", (err) => {
  console.error("Serial Port Error:", err);
});

module.exports = {
  getLastKey: () => lastKey,
  getInputBuffer: () => inputBuffer,
  getEnterPressed: () => enterPressed,
  clearEnter: () => {
    enterPressed = false;
    // Don't clear inputBuffer here - let the frontend handle it
  },
  clearBuffer: () => {
    inputBuffer = "";
    enterPressed = false;
  },
  serialPort, // 👈 ADD THI
};
