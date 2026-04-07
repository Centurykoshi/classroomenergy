#define PIR_PIN D1
#define LED_PIN D2   // External LED on D2

const bool PIR_INVERTED = false;

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(PIR_PIN, INPUT);      // if unstable, try INPUT_PULLUP and set PIR_INVERTED=true
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);   // OFF initially

  Serial.println("PIR warmup 30s...");
  delay(30000);
  Serial.println("Started: instant ON/OFF mode");
}

void loop() {
  int raw = digitalRead(PIR_PIN);
  bool motion = PIR_INVERTED ? (raw == LOW) : (raw == HIGH);

  // Instant mapping
  digitalWrite(LED_PIN, motion ? HIGH : LOW);

  Serial.printf("raw=%d motion=%d led=%d\n", raw, motion, motion ? 1 : 0);

  delay(50);
}