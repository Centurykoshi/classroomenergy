#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// TEST MODE - Set to true for 10-second test run
#define TEST_MODE true

// WiFi credentials
const char* ssid = "vivo Y22";
const char* password = "09876543";

// Server URL
const char* serverUrl = "http://10.179.251.249:3000/api/esp8266/state";

// Polling interval (milliseconds) - shorter in test mode
const unsigned long POLL_INTERVAL = TEST_MODE ? 1000 : 3000;
unsigned long lastPollTime = 0;

// Motion sensor configuration
#define MOTION_SENSOR_PIN D2  // GPIO 4 - PIR motion sensor
#define MOTION_TIMEOUT TEST_MODE ? 5000 : 30000  // 5 seconds in test mode, 30 seconds normally
unsigned long lastMotionTime = 0;
bool motionDetected = false;
bool wasMotionDetected = false;

// Test mode timing
unsigned long testModeStartTime = 0;
const unsigned long TEST_DURATION = 10000;  // 10 seconds

//work 

// Store relay pin states and classroom IDs
const int MAX_CLASSROOMS = 10;
int relayPins[MAX_CLASSROOMS];
String classroomIds[MAX_CLASSROOMS];
bool relayStates[MAX_CLASSROOMS];
int classroomCount = 0;

// Manual override tracking - when user manually turns lights OFF, prevent motion from turning back ON
unsigned long manualOverrideTimes[MAX_CLASSROOMS];  // Timestamp when manual override was activated
const unsigned long MANUAL_OVERRIDE_DURATION = 300000;  // 5 minutes - override active for this duration
bool manualOverrideActive[MAX_CLASSROOMS];  // Track if manual override is currently active

// Motion update URL
const char* motionUpdateUrl = "http://10.179.251.249:3000/api/classrooms/motion-update";

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\n\nClassroom Energy Control System with Motion Sensor");
  Serial.println("===================================================");

  if (TEST_MODE) {
    Serial.println("⚠️  TEST MODE ENABLED - 10 Second Test Run");
    Serial.println("Motion timeout: 5 seconds | Poll interval: 1 second | Calibration: 2 seconds");
  }

  // Initialize motion sensor pin as INPUT
  pinMode(MOTION_SENSOR_PIN, INPUT);
  Serial.println("Motion Sensor initialized on pin D2 (GPIO 4)");
  
  // Debug: Check initial sensor reading
  delay(100);
  int initialReading = digitalRead(MOTION_SENSOR_PIN);
  Serial.printf("Initial Motion Sensor Reading: %d\n", initialReading);
  
  // Shorter calibration in test mode
  unsigned long calibrationTime = TEST_MODE ? 2000 : 60000;
  Serial.printf("Waiting %lu milliseconds for sensor calibration...\n", calibrationTime);
  Serial.println("DO NOT move the sensor during calibration!");
  delay(calibrationTime);

  // Initialize manual override arrays
  for (int i = 0; i < MAX_CLASSROOMS; i++) {
    manualOverrideActive[i] = false;
    manualOverrideTimes[i] = 0;
  }

  testModeStartTime = millis();
  connectToWiFi();
}

void loop() {
  // Check if test mode duration has elapsed
  if (TEST_MODE && (millis() - testModeStartTime > TEST_DURATION)) {
    static bool testComplete = false;
    if (!testComplete) {
      Serial.println("\n╔════════════════════════════════════════╗");
      Serial.println("║        TEST COMPLETED (10 seconds)     ║");
      Serial.println("╚════════════════════════════════════════╝");
      testComplete = true;
    }
    delay(100);  // Slow down loop to reduce spam
    return;  // Stop execution after test
  }

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }

  // Check motion sensor continuously
  checkMotionSensor();

  // Poll server at regular intervals
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    pollServerState();
  }
}

// Connect to WiFi
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }
}

// Check motion sensor and control lights
void checkMotionSensor() {
  bool currentMotion = digitalRead(MOTION_SENSOR_PIN);

  // Debug: Print sensor reading every 3 seconds
  static unsigned long lastDebugTime = 0;
  if (millis() - lastDebugTime > 3000) {
    Serial.printf("DEBUG - Motion Sensor Reading: %d (0=No Motion, 1=Motion Detected)\n", currentMotion);
    Serial.printf("DEBUG - wasMotionDetected: %d, motionDetected: %d\n", wasMotionDetected, motionDetected);
    lastDebugTime = millis();
  }

  // Only trigger on motion CHANGE from false to true (actual motion event)
  if (currentMotion && !wasMotionDetected) {
    // Motion just detected (transition from no motion to motion)
    Serial.println("Motion DETECTED! Turning lights ON");
    lastMotionTime = millis();
    turnOnAllLights();
    wasMotionDetected = true;
    motionDetected = true;
  } else if (currentMotion) {
    // Motion still happening - reset timeout
    lastMotionTime = millis();
    motionDetected = true;
  } else {
    // No motion signal from sensor
    motionDetected = false;
    
    // Check if timeout has expired
    if (millis() - lastMotionTime > MOTION_TIMEOUT && wasMotionDetected) {
      Serial.println("Motion timeout! No movement for 30 seconds, turning lights OFF");
      turnOffAllLights();
      wasMotionDetected = false;
    }
  }
}

// Turn all lights ON
void turnOnAllLights() {
  for (int i = 0; i < classroomCount; i++) {
    if (relayPins[i] > 0 && !relayStates[i]) {
      digitalWrite(relayPins[i], 0);  // 0 = Relay activates (ON) for active-LOW relay
      relayStates[i] = true;
      Serial.printf("Light ON - Pin: %d\n", relayPins[i]);
      
      // Notify server about motion-triggered light ON
      notifyServerMotionState(classroomIds[i], "ON", relayPins[i]);
    }
  }
}

// Turn all lights OFF
void turnOffAllLights() {
  for (int i = 0; i < classroomCount; i++) {
    if (relayPins[i] > 0 && relayStates[i]) {
      digitalWrite(relayPins[i], 1);  // 1 = Relay deactivates (OFF) for active-LOW relay
      relayStates[i] = false;
      Serial.printf("Light OFF - Pin: %d\n", relayPins[i]);
      
      // Notify server about motion-triggered light OFF
      notifyServerMotionState(classroomIds[i], "OFF", relayPins[i]);
    }
  }
}

// Notify server about motion-triggered state change
void notifyServerMotionState(String classroomId, const char* action, int pin) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  Serial.printf("Notifying server: Classroom %s turned %s\n", classroomId.c_str(), action);

  http.begin(client, motionUpdateUrl);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["classroomId"] = classroomId;
  doc["action"] = action;
  doc["pin"] = pin;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.printf("Server response code: %d\n", httpCode);
  } else {
    Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// Poll server for classroom states
void pollServerState() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  Serial.print("Polling server: ");
  Serial.println(serverUrl);

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.GET();

  if (httpCode > 0 && httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("Response: " + payload);

    DynamicJsonDocument doc(2048); // Increase size for multiple classrooms
    DeserializationError error = deserializeJson(doc, payload);
    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      return;
    }

    JsonArray classrooms = doc.as<JsonArray>();
    classroomCount = classrooms.size();

    for (int idx = 0; idx < classrooms.size(); idx++) {
      JsonObject classroom = classrooms[idx];
      String name = classroom["name"];
      String id = classroom["id"];
      int state = classroom["state"];
      int pin = classroom["pin"]; // Use pin from JSON

      // Store pin and classroom ID
      if (idx < MAX_CLASSROOMS) {
        relayPins[idx] = pin;
        classroomIds[idx] = id;
      }

      // Initialize pin as OUTPUT (safe even if called repeatedly)
      pinMode(pin, OUTPUT);

      // Check if manual override is still active for this classroom
      bool isManualOverrideActive = false;
      if (idx < MAX_CLASSROOMS && manualOverrideActive[idx]) {
        unsigned long timeSinceOverride = millis() - manualOverrideTimes[idx];
        if (timeSinceOverride < MANUAL_OVERRIDE_DURATION) {
          isManualOverrideActive = true;
          Serial.printf("Classroom %s: Manual override ACTIVE (expires in %lu seconds)\n", 
                        name.c_str(), (MANUAL_OVERRIDE_DURATION - timeSinceOverride) / 1000);
        } else {
          // Override duration expired
          manualOverrideActive[idx] = false;
          Serial.printf("Classroom %s: Manual override EXPIRED, returning to auto mode\n", name.c_str());
        }
      }

      // Determine light state
      bool shouldFollowMotion = motionDetected && wasMotionDetected && !isManualOverrideActive;
      bool serverSaysOn = (state == 1);
      
      bool lightShouldBeOn = shouldFollowMotion || (serverSaysOn && !isManualOverrideActive);

      // Update relay / LED based on logic
      if (lightShouldBeOn) {
        digitalWrite(pin, 0);  // 0 = Relay activates (ON) for active-LOW relay
        relayStates[idx] = true;
        if (shouldFollowMotion) {
          Serial.printf("Classroom: %s, Pin: %d, State: ON (Motion active)\n", name.c_str(), pin);
        } else {
          Serial.printf("Classroom: %s, Pin: %d, State: ON (Server command)\n", name.c_str(), pin);
        }
      } else {
        digitalWrite(pin, 1);  // 1 = Relay deactivates (OFF) for active-LOW relay
        relayStates[idx] = false;
        if (isManualOverrideActive) {
          Serial.printf("Classroom: %s, Pin: %d, State: OFF (Manual override)\n", name.c_str(), pin);
        } else {
          Serial.printf("Classroom: %s, Pin: %d, State: OFF (Server)\n", name.c_str(), pin);
        }
      }

      // Detect manual override: Server says OFF but motion sensor wants it ON (and it wasn't ON before)
      if (!serverSaysOn && motionDetected && !manualOverrideActive[idx] && idx < MAX_CLASSROOMS) {
        manualOverrideActive[idx] = true;
        manualOverrideTimes[idx] = millis();
        Serial.printf("*** MANUAL OVERRIDE DETECTED for %s - respecting user's OFF command for %lu seconds ***\n", 
                      name.c_str(), MANUAL_OVERRIDE_DURATION / 1000);
      }
    }
  } else {
    Serial.printf("HTTP GET failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}
