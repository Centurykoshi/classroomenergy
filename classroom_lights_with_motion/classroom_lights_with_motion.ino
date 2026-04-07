#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// ============================
// WiFi credentials


// ============================
const char* ssid = "Airtel_PiyushRicha";
const char* password = "richapiyush";

// ============================
// Server URLs
// ============================
const char* serverUrl = "http://192.168.1.6:3000/api/esp8266/state";                 // GET
const char* motionUpdateUrl = "http://192.168.1.6:3000/api/classrooms/motion-update"; // POST

// ============================
// Timings
// ============================
const unsigned long POLL_INTERVAL = 3000;           // 3 sec
const unsigned long MOTION_TIMEOUT = 30000;         // 30 sec

// ============================
// Motion sensor
// ============================
#define MOTION_SENSOR_PIN D2 // GPIO4
#define MOTION_DETECTION_ENABLED false  // Set to true when sensor is connected

unsigned long lastPollTime = 0;
unsigned long lastMotionTime = 0;

bool motionDetected = false;     // current raw/instant motion status (true only while sensor is high)
bool wasMotionDetected = false;  // "motion session" active until timeout

// ============================
// Classroom / relay state
// ============================
const int MAX_CLASSROOMS = 10;

int relayPins[MAX_CLASSROOMS];
String classroomIds[MAX_CLASSROOMS];
bool relayStates[MAX_CLASSROOMS]; // true = ON, false = OFF
bool pinInitialized[MAX_CLASSROOMS];
bool forceOffState[MAX_CLASSROOMS];  // User-initiated force OFF flag
unsigned long forceOffTimes[MAX_CLASSROOMS];  // Timestamp of force OFF

int classroomCount = 0;

// ============================
// Helpers
// ============================
bool isValidRelayPin(int pin) {
  // Keep simple check; adjust if your hardware has specific allowed pins only.
  return pin > 0;
}

void relayOn(int pin) {
  // Relay: HIGH turns ON
  digitalWrite(pin, HIGH);
}

void relayOff(int pin) {
  // Relay: LOW turns OFF
  digitalWrite(pin, LOW);
}

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

void notifyServerMotionState(const String& classroomId, const char* action, int pin) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  Serial.printf("Notifying server: Classroom %s turned %s\n", classroomId.c_str(), action);

  http.begin(client, motionUpdateUrl);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(256);
  doc["classroomId"] = classroomId;
  doc["action"] = action;
  doc["pin"] = pin;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("Motion update response code: %d\n", httpCode);
  } else {
    Serial.printf("Motion update POST failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void turnOnAllLightsFromMotion() {
  for (int i = 0; i < classroomCount; i++) {
    if (!isValidRelayPin(relayPins[i])) continue;
    if (forceOffState[i]) continue;  // respect user force OFF
    if (!relayStates[i]) {
      relayOn(relayPins[i]);
      relayStates[i] = true;
      Serial.printf("Light ON (motion) - Pin: %d\n", relayPins[i]);
      notifyServerMotionState(classroomIds[i], "ON", relayPins[i]);
    }
  }
}

void turnOffAllLightsFromMotionTimeout() {
  for (int i = 0; i < classroomCount; i++) {
    if (!isValidRelayPin(relayPins[i])) continue;
    if (relayStates[i]) {
      relayOff(relayPins[i]);
      relayStates[i] = false;
      Serial.printf("Light OFF (motion timeout) - Pin: %d\n", relayPins[i]);
      notifyServerMotionState(classroomIds[i], "OFF", relayPins[i]);
    }
  }
}

void checkMotionSensor() {
  // Motion detection disabled - sensor not connected
  if (!MOTION_DETECTION_ENABLED) {
    if (wasMotionDetected) {
      wasMotionDetected = false;
      motionDetected = false;
    }
    return;
  }

  bool currentMotion = digitalRead(MOTION_SENSOR_PIN);

  static unsigned long lastDebugTime = 0;
  if (millis() - lastDebugTime > 3000) {
    Serial.printf("DEBUG - Motion Sensor Reading: %d (0=No Motion, 1=Motion)\n", currentMotion);
    Serial.printf("DEBUG - wasMotionDetected: %d, motionDetected: %d\n", wasMotionDetected, motionDetected);
    lastDebugTime = millis();
  }

  if (currentMotion && !wasMotionDetected) {
    // New motion event
    Serial.println("Motion DETECTED! Turning lights ON");
    lastMotionTime = millis();
    motionDetected = true;
    wasMotionDetected = true;
    turnOnAllLightsFromMotion();
  } else if (currentMotion) {
    // Motion continues
    lastMotionTime = millis();
    motionDetected = true;
  } else {
    // No motion right now
    motionDetected = false;

    // End of motion session after timeout
    if (wasMotionDetected && (millis() - lastMotionTime > MOTION_TIMEOUT)) {
      Serial.println("Motion timeout! No movement for 30 seconds, turning lights OFF");
      wasMotionDetected = false;
      turnOffAllLightsFromMotionTimeout();
    }
  }
}

void pollServerState() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  Serial.print("Polling server: ");
  Serial.println(serverUrl);

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("Response: " + payload);

    DynamicJsonDocument doc(4096);
    DeserializationError err = deserializeJson(doc, payload);
    if (err) {
      Serial.print("JSON parse failed: ");
      Serial.println(err.c_str());
      http.end();
      return;
    }

    if (!doc.is<JsonArray>()) {
      Serial.println("ERROR: Expected JSON array from /api/esp8266/state");
      http.end();
      return;
    }

    JsonArray classrooms = doc.as<JsonArray>();
    classroomCount = min((int)classrooms.size(), MAX_CLASSROOMS);

    for (int idx = 0; idx < classroomCount; idx++) {
      JsonObject c = classrooms[idx];

      String name = c["name"] | String("Unknown");
      String id = c["id"] | String("");
      int pin = c["pin"] | -1;
      int state = c["state"] | 0; // server command: 1=ON, 0=OFF
      bool forceOff = c["forceOff"] | false;  // user-initiated force OFF flag

      if (!isValidRelayPin(pin)) {
        Serial.printf("Skipping invalid pin for %s\n", name.c_str());
        continue;
      }

      // Store mapping
      relayPins[idx] = pin;
      classroomIds[idx] = id;

      // Initialize pin once
      if (!pinInitialized[idx]) {
        pinMode(pin, OUTPUT);
        relayOff(pin); // safe default
        pinInitialized[idx] = true;
      }

      // Handle force OFF flag
      if (forceOff && !forceOffState[idx]) {
        forceOffState[idx] = true;
        forceOffTimes[idx] = millis();
        Serial.printf("*** FORCE OFF activated for %s ***\n", name.c_str());
      }

      // Clear force OFF flag after timeout or if server doesn't send it
      if (forceOffState[idx] && !forceOff) {
        unsigned long elapsed = millis() - forceOffTimes[idx];
        if (elapsed >= 5000) {  // 5 second default timeout for force OFF
          forceOffState[idx] = false;
          Serial.printf("*** FORCE OFF expired for %s ***\n", name.c_str());
        }
      }

      bool serverSaysOn = (state == 1);
      bool shouldFollowMotion = wasMotionDetected; // motion session active until timeout

      // SIMPLIFIED LOGIC:
      // 1. If user forced OFF → stay OFF
      // 2. If server says ON → turn ON
      // 3. If server says OFF → turn OFF
      // 4. If motion active and server doesn't say OFF → turn ON
      bool lightShouldBeOn = false;

      if (forceOffState[idx]) {
        // Force OFF takes precedence
        lightShouldBeOn = false;
      } else if (serverSaysOn) {
        // Server explicit ON command
        lightShouldBeOn = true;
      } else if (shouldFollowMotion) {
        // Motion active - turn ON unless server explicitly says OFF
        lightShouldBeOn = true;
      } else {
        // Follow server OFF
        lightShouldBeOn = false;
      }

      // Apply relay state
      if (lightShouldBeOn) {
        relayOn(pin);
        relayStates[idx] = true;
        if (shouldFollowMotion && !serverSaysOn) {
          Serial.printf("Classroom: %s, Pin: %d, State: ON (Motion active)\n", name.c_str(), pin);
        } else {
          Serial.printf("Classroom: %s, Pin: %d, State: ON (Server command)\n", name.c_str(), pin);
        }
      } else {
        relayOff(pin);
        relayStates[idx] = false;
        if (forceOffState[idx]) {
          Serial.printf("Classroom: %s, Pin: %d, State: OFF (Force OFF active)\n", name.c_str(), pin);
        } else {
          Serial.printf("Classroom: %s, Pin: %d, State: OFF (Server)\n", name.c_str(), pin);
        }
      }
    }
  } else {
    Serial.printf("HTTP GET failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\n\nClassroom Energy Control System with Motion Sensor");
  Serial.println("===================================================");

  // Initialize arrays
  for (int i = 0; i < MAX_CLASSROOMS; i++) {
    relayPins[i] = -1;
    classroomIds[i] = "";
    relayStates[i] = false;
    pinInitialized[i] = false;
    forceOffState[i] = false;
    forceOffTimes[i] = 0;
  }

  // Motion sensor init
  pinMode(MOTION_SENSOR_PIN, INPUT);
  Serial.println("Motion Sensor initialized on pin D2 (GPIO 4)");
  Serial.println("NOTE: Motion detection is DISABLED - sensor not connected");

  delay(100);
  int initialReading = digitalRead(MOTION_SENSOR_PIN);
  Serial.printf("Initial Motion Sensor Reading: %d\n", initialReading);

  // PIR calibration - skip if motion detection disabled
  if (MOTION_DETECTION_ENABLED) {
    unsigned long calibrationTime = 60000;
    Serial.printf("Waiting %lu ms for sensor calibration...\n", calibrationTime);
    Serial.println("DO NOT move the sensor during calibration!");
    delay(calibrationTime);
  } else {
    Serial.println("Skipping motion sensor calibration (motion detection disabled)");
  }

  connectToWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }

  checkMotionSensor();

  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    pollServerState();
  }
}