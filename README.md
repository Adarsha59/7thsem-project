# Face Recognition-Based Door Unlock System

This project implements a **facial recognition-based door unlocking system** using **ReactJS**, **Express**, **NodeJS**, and **face-api.js**. The system leverages machine learning models for face detection and recognition, and integrates with **Arduino** and a **servo motor** to control a physical door lock. It provides a modern and secure method of unlocking doors based on facial identification.

## Technologies Used

- **Frontend**: ReactJS, face-api.js
- **Backend**: NodeJS, Express
- **Machine Learning**: face-api.js (for face recognition and detection)
- **Hardware**: Arduino, Servo Motor
- **Communication**: Serial Communication (via USB connection to Arduino)

## Overview

### Face Recognition and Door Unlock Process:

1. **Frontend (ReactJS)**:

   - The system uses **face-api.js** to capture and analyze the face of a person using a webcam.
   - It compares the detected face with pre-stored images of authorized individuals.
   - If an authorized face is detected, a request is sent to the backend API, which communicates with the Arduino to unlock the door.

2. **Backend (NodeJS/Express)**:

   - The server uses **SerialPort** to communicate with the **Arduino** via USB.
   - The backend listens for facial recognition events from the frontend and sends a signal to the Arduino to control the servo motor for unlocking or locking the door.

3. **Arduino**:
   - The Arduino is connected to a **servo motor** that controls the door lock.
   - Upon receiving the signal from the backend, the Arduino activates the servo to unlock the door. After a certain period, it locks the door again if the face is still not recognized or after a timeout.

### Workflow:

1. **Capture the face**: The frontend opens the webcam and detects the user's face using **face-api.js**.
2. **Face comparison**: The detected face is compared with the pre-stored authorized faces.
3. **Authorized face**:
   - If the face is authorized, the backend sends a signal to the Arduino via serial communication (`signal: 1`), which turns the servo motor on and unlocks the door.
4. **Unknown face**:
   - If an unknown face is detected, no action is performed, and the system logs the detection as an unknown person.
   - The user is redirected to an "Unknown Person Detected" page.
5. **Automatic lock**: After a set time, the door automatically locks again by sending a signal (`signal: 0`).

## Face Recognition Implementation

We use the following **machine learning models** from **face-api.js** for facial recognition:

- `ssdMobilenetv1`: A face detection model for detecting faces.
- `faceRecognitionNet`: A model for recognizing faces.
- `faceLandmark68Net`: A model for detecting facial landmarks (e.g., eyes, nose, mouth).

These models are loaded from a server endpoint (`/models`) and used to perform facial detection and recognition on the webcam stream.

### Code Example for Loading Models:

```javascript
await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
```

Once the models are loaded, the system can detect faces, extract facial descriptors, and match them with stored face data to determine whether the person is authorized.

### Serial Communication with Arduino

To communicate with the Arduino, we use the SerialPort library in NodeJS. The serial communication enables sending signals to the Arduino to control the servo motor, which unlocks or locks the door.

```javascript
const { SerialPort } = require("serialport");
const { ByteLengthParser } = require("@serialport/parser-byte-length");

const serialPort = new SerialPort(
  {
    path: "/dev/ttyACM0", // Ensure this is correct for your setup
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

serialPort.open((err) => {
  if (err) {
    console.error("Error opening serial port:", err.message);
  } else {
    console.log("Serial Port Opened Successfully!");
  }
});

// Function to send signal to Arduino
const sendSignal = (signal) => {
  serialPort.write(signal, (err) => {
    if (err) {
      console.error("Error sending signal:", err.message);
    } else {
      console.log(`Signal ${signal} sent to Arduino`);
    }
  });
};
```

# Face Recognition-Based Door Unlock System

## System Architecture

- **Frontend (ReactJS):** Captures and processes webcam feed, performs face recognition using face-api.js, and communicates with the backend API to send recognition results.
- **Backend (NodeJS/Express):** Manages API requests from the frontend, processes face recognition results, and controls the Arduino via serial communication to manage the servo motor.
- **Arduino:** Controls the servo motor based on signals sent by the backend to unlock or lock the door.

## Getting Started

### Prerequisites:

1. Install **Node.js** and **npm**.
2. Set up **Arduino IDE** and connect the Arduino with the servo motor.
3. Install **ReactJS** and **Express**.
4. Download and load the **face-api.js**
   [Face-Api](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
   [module](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
   - `ssdMobilenetv1`
   - `faceRecognitionNet`
   - `faceLandmark68Net`

### Connect Arduino:

- Ensure that the Arduino is connected to your computer via **USB** and the servo motor is connected to the correct pins.

### Test the System:

1. Open the **ReactJS** frontend in your browser.
2. The webcam should activate, and the system will begin detecting faces.
3. When a recognized face is detected, the door should unlock (servo motor activation).
4. If an unknown face is detected, the system will display **"Unknown Person Detected"**.

## Conclusion

This **Face Recognition-Based Door Unlock System** provides a secure and modern solution for door access using facial recognition. By integrating machine learning for face detection and recognition, hardware control through Arduino, and a responsive frontend with ReactJS, this project demonstrates the power of combining software and hardware for innovative security solutions.

## Future Enhancements:

1. Add more user profiles for multiple authorized faces.
2. Implement better error handling for hardware communication.
3. Optimize the face recognition algorithm for better accuracy and performance.

# Developer Information

## Name

Adarsha Paudyal

## Contact Information

- **Email:** code.adarsha@gmail.com
- **GitHub:** [github.com/Adarsha59/](https://github.com/Adarsha59/)

# 😍 Contribution
