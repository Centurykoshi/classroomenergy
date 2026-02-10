#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL (replace with your Next.js app URL)
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/esp8266/state";

// Pin configuration
const int RELAY_PIN_CLASS_63 = D1;  // GPIO5 for Class 63

// Polling interval (milliseconds)
const unsigned long POLL_INTERVAL = 3000;  // 3 seconds
unsigned long lastPollTime = 0;

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Initialize relay pin
  pinMode(RELAY_PIN_CLASS_63, OUTPUT);
  digitalWrite(RELAY_PIN_CLASS_63, LOW);  // Start with light OFF
  
  Serial.println("\n\nClassroom Energy Control System");
  Serial.println("================================");
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Poll server for state updates
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    pollServerState();
  }
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

void pollServerState() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  WiFiClient client;
  HTTPClient http;
  
  Serial.print("Polling server: ");
  Serial.println(serverUrl);
  
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpCode);
    
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println("Response: " + payload);
      
      // Parse JSON response
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);
      
      if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
      }
      
      // Process each classroom
      JsonArray classrooms = doc.as<JsonArray>();
      for (JsonObject classroom : classrooms) {
        String name = classroom["name"];
        int state = classroom["state"];
        int pin = classroom["pin"];
        
        Serial.printf("Classroom: %s, Pin: %d, State: %d\n", 
                     name.c_str(), pin, state);
        
        // Update relay based on classroom name
        if (name == "Class - 63") {
          digitalWrite(RELAY_PIN_CLASS_63, state);
          Serial.printf("Class 63 light: %s\n", state ? "ON" : "OFF");
        }
      }
    }
  } else {
    Serial.printf("HTTP GET failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}