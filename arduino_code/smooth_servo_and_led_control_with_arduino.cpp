#include <Servo.h>

Servo myServo;

const int ledPin = 8;
const int servoPin = 9;

// Smooth sweep variables
int targetPos = 0;  // Desired servo angle (0 or 180)
int currentPos = 0; // Current servo angle
unsigned long lastMoveTime = 0;
const int stepDelay = 10; // ms between steps → adjust for speed

void setup()
{
    Serial.begin(9600); // USB serial to Node.js
    pinMode(ledPin, OUTPUT);
    myServo.attach(servoPin);

    digitalWrite(ledPin, LOW);
    myServo.write(currentPos); // Start at 0 degrees
}

void loop()
{
    // Listen for incoming signal
    if (Serial.available() > 0)
    {
        char signal = Serial.read();
        if (signal == '1')
        {
            digitalWrite(ledPin, HIGH);
            targetPos = 180; // Open
            Serial.println("ON");
        }
        else if (signal == '0')
        {
            digitalWrite(ledPin, LOW);
            targetPos = 0; // Close
            Serial.println("OFF");
        }
    }

    // Smoothly move towards targetPos
    unsigned long now = millis();
    if (now - lastMoveTime >= stepDelay)
    {
        if (currentPos < targetPos)
        {
            currentPos++;
            myServo.write(currentPos);
        }
        else if (currentPos > targetPos)
        {
            currentPos--;
            myServo.write(currentPos);
        }
        lastMoveTime = now;
    }
}