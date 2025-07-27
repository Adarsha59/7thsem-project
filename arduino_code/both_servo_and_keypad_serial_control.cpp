#include <Keypad.h>
#include <Servo.h>

// === KEYPAD ===
const byte ROWS = 4; // 4 rows
const byte COLS = 4; // 4 columns

char keys[ROWS][COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}};

byte rowPins[ROWS] = {9, 8, 7, 6}; // adjust for your pins
byte colPins[COLS] = {5, 4, 3, 2};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// === SERVO + LED ===
Servo myServo;

const int ledPin = 10;
const int servoPin = 11;

int targetPos = 0;  // Desired servo angle (0 or 180)
int currentPos = 0; // Current servo angle
unsigned long lastMoveTime = 0;
const int stepDelay = 10; // ms between steps

void setup()
{
    Serial.begin(9600);

    // Setup servo + LED
    pinMode(ledPin, OUTPUT);
    myServo.attach(servoPin);
    digitalWrite(ledPin, LOW);
    myServo.write(currentPos);
}

void loop()
{
    // === 1) Read Keypad ===
    char key = keypad.getKey();
    if (key)
    {
        Serial.println(key);
    }

    // === 2) Listen for servo/LED signal ===
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

    // === 3) Smooth Servo Movement ===
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
