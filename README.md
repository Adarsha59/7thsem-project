# Face Recognition-Based Door Unlock System

This project implements a **facial recognition-based door unlocking system** using **ReactJS**, **Express**, **NodeJS**, and **face-api.js**. The system leverages machine learning models for face detection and recognition, and integrates with **Arduino** and a **servo motor** to control a physical door lock. It provides a modern and secure method of unlocking doors based on facial identification.

![System Architecture](./Face%20Api.png)

## Technologies Used

- **Frontend**: ReactJS, face-api.js
- **Backend**: NodeJS, Express, MongoDB
- **Machine Learning**: face-api.js (for face recognition and detection)
- **Hardware**: Arduino, Servo Motor, 4x4 Keypad
- **Communication**: Serial Communication (via USB connection to Arduino)

## Overview

### Face Recognition and Door Unlock Process:

1. **Frontend (ReactJS)**:

   - The system uses **face-api.js** to capture and analyze the face of a person using a webcam.
   - It compares the detected face with pre-stored images of authorized individuals.
   - Includes liveness detection through facial expression analysis to prevent spoofing.
   - If an authorized face is detected, a request is sent to the backend API.

2. **Backend (NodeJS/Express)**:

   - The server uses **SerialPort** to communicate with the **Arduino** via USB.
   - Manages user registration and authentication through MongoDB database.
   - The backend listens for facial recognition events from the frontend and sends signals to Arduino.
   - Implements multi-factor authentication combining face recognition with PIN verification.

3. **Arduino**:
   - The Arduino is connected to a **servo motor** that controls the door lock.
   - Connected to a **4x4 keypad** for PIN entry as secondary authentication.
   - Upon receiving the signal from the backend, the Arduino activates the servo to unlock the door.
   - After a certain period, it locks the door again automatically.

### Workflow:

1. **Face Detection**: The frontend opens the webcam and detects the user's face using **face-api.js**.
2. **Face Recognition**: The detected face is compared with the pre-stored authorized faces in the database.
3. **Liveness Check**: System analyzes facial expressions to ensure it's a real person, not a photo/video.
4. **PIN Verification**: User enters PIN using the physical keypad for multi-factor authentication.
5. **Authorized Access**:
   - If both face and PIN are verified, the backend sends a signal to Arduino (`signal: 1`).
   - Arduino turns the servo motor and unlocks the door.
6. **Unknown Person**:
   - If an unknown face is detected, no action is performed.
   - The user is redirected to an "Unknown Person Detected" page.
   - All attempts are logged in the database.
7. **Automatic Lock**: After a set time, the door automatically locks again by sending a signal (`signal: 0`).

## Face Recognition Implementation

We use the following **machine learning models** from **face-api.js** for facial recognition:

- `ssdMobilenetv1`: Face detection model (92% accuracy, ~5.4 MB)
- `faceRecognitionNet`: Face recognition model (89% accuracy, ~6.2 MB)
- `faceLandmark68Net`: Facial landmarks detection (94% accuracy, ~350 KB)
- `faceExpressionNet`: Expression analysis for liveness detection (78% accuracy, ~310 KB)

### Code Example for Loading Models:

```javascript
// Load face-api.js models
await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
await faceapi.nets.faceExpressionNet.loadFromUri("/models");

// Face recognition with liveness detection
const detectionsWithExpressions = await faceapi
  .detectAllFaces(video)
  .withFaceLandmarks()
  .withFaceDescriptors()
  .withFaceExpressions();
```

## Serial Communication with Arduino

To communicate with the Arduino, we use the SerialPort library in NodeJS:

```javascript
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
```

## Arduino Code For PIN

```cpp
#include <Keypad.h>

const byte ROWS = 4; // 4 rows
const byte COLS = 4; // 4 columns

char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte rowPins[ROWS] = {9, 8, 7, 6}; // adjust for your pins
byte colPins[COLS] = {5, 4, 3, 2};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void setup() {
  Serial.begin(9600); // connect to USB serial
}

void loop() {
  char key = keypad.getKey();
  if (key) {
    Serial.println(key); // send the key to PC
  }
}
```

## Arduino Code For Servo

```cpp
#include <Servo.h>

Servo myServo;

const int ledPin = 8;
const int servoPin = 9;

// Smooth sweep variables
int targetPos = 0;           // Desired servo angle (0 or 180)
int currentPos = 0;          // Current servo angle
unsigned long lastMoveTime = 0;
const int stepDelay = 10;    // ms between steps → adjust for speed

void setup() {
  Serial.begin(9600);        // USB serial to Node.js
  pinMode(ledPin, OUTPUT);
  myServo.attach(servoPin);

  digitalWrite(ledPin, LOW);
  myServo.write(currentPos); // Start at 0 degrees
}

void loop() {
  // Listen for incoming signal
  if (Serial.available() > 0) {
    char signal = Serial.read();
    if (signal == '1') {
      digitalWrite(ledPin, HIGH);
      targetPos = 180;       // Open
      Serial.println("ON");
    } else if (signal == '0') {
      digitalWrite(ledPin, LOW);
      targetPos = 0;         // Close
      Serial.println("OFF");
    }
  }

  // Smoothly move towards targetPos
  unsigned long now = millis();
  if (now - lastMoveTime >= stepDelay) {
    if (currentPos < targetPos) {
      currentPos++;
      myServo.write(currentPos);
    } else if (currentPos > targetPos) {
      currentPos--;
      myServo.write(currentPos);
    }
    lastMoveTime = now;
  }
}
```

## Hardware Connections

```
Arduino Uno Connections:
├── Servo Motor (SG90)
│   ├── Red Wire    → 5V
│   ├── Brown Wire  → GND
│   └── Orange Wire → Pin 9
├── 4x4 Keypad
│   ├── Row Pins    → Pins 2, 3, 4, 5
│   └── Col Pins    → Pins 6, 7, 8, A0
└── USB Cable       → Computer (Serial Communication)
```

## Installation & Setup

### Prerequisites:

1. **Node.js** (v14 or higher)
2. **MongoDB** (for user data storage)
3. **Arduino IDE**
4. **Webcam** (USB or built-in)
5. **Servo Motor** (for door locking/unlocking mechanism)
6. **4x4 Keypad** (for PIN/password input)

### Frontend Setup:

```bash
# Install dependencies
npm install

# Start React development server
npm start
```

### Backend Setup:

```bash
# Install backend dependencies
npm install

# Start backend server
node index.js / nodemon index.js
```

### Arduino Setup:

1. Install required libraries: `Servo.h`, `Keypad.h`
2. Connect hardware as per wiring diagram
3. Upload the Arduino code to your board
4. Note the COM port (Windows) or `/dev/ttyACM0` (Linux/Mac)
5. Download Arduino IDE: [https://www.arduino.cc/en/software/](https://www.arduino.cc/en/software/)

### Face-api.js Models:

Download the required models and place them in `/public/models/`:

- [ssdMobilenetv1](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
- [faceRecognitionNet](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
- [faceLandmark68Net](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
- [faceExpressionNet](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

## User Registration

```javascript
// Register new user with multiple face samples
// backend/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{5}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid password! Password must be exactly 5 digits.`,
    },
  },
  imagePath: { type: String },
});

module.exports = mongoose.model("User", userSchema);

};
```

## Testing the System

1. **Start the Backend**: `node index.js`
2. **Start the Frontend**: `npm start`
3. **Connect Arduino**: Ensure Arduino is connected and port is correct
4. **Register Users**: Add authorized faces through the web interface
5. **Test Recognition**: Stand in front of the camera for face detection
6. **Enter PIN**: Use the physical keypad to enter your PIN
7. **Door Operation**: Servo motor should unlock the door upon successful authentication

## Performance Metrics

- **Recognition Speed**: ~2 seconds average
- **Accuracy Rate**: 73-75% under various lighting conditions
- **False Positive Rate**: <15%
- **Liveness Detection**: 78%+ success rate

## Security Features

- **Multi-factor Authentication**: Face + PIN verification
- **Liveness Detection**: Prevents photo/video spoofing
- **Access Logging**: All attempts logged with timestamps
- **Auto-lock**: Door locks automatically after timeout
- **Failed Attempt Monitoring**: Alerts on repeated unauthorized access

## Troubleshooting

### Common Issues:

- **Arduino not detected**: Check COM port and drivers
- **Face recognition fails**: Ensure proper lighting and camera positioning
- **Models not loading**: Verify model files are in `/public/models/`
- **Serial communication errors**: Check baud rate and port settings

## Project Structure

```
.
├── backend
│   ├── config
│   ├── help.js
│   ├── index.js
│   ├── models
│   ├── package.json
│   ├── package-lock.json
│   ├── routes
│   └── uploads
├── Face Api.png
├── package.json
├── package-lock.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── labels
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   ├── models
│   └── robots.txt
├── README.md
├── src
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── components
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   └── pages
└── tailwind.config.js
```

## Developer Information

**Team Members:**

- **Adarsha Paudyal** (201101) - Project Lead

**Institution:** Nepal College of Information Technology  
**Department:** Electronics and Communications Engineering

## Contact Information

- **Email:** code.adarsha@gmail.com
- **GitHub:** [github.com/Adarsha59/](https://github.com/Adarsha59/)

## 😍 Contribution

Contributions are welcome! Please feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is developed for academic purposes at Nepal College of Information Technology.
