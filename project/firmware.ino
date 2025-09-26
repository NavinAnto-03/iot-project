// firmware.ino - Urban Safety Monitor for Coimbatore
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

// Sensor pins
const int DHT_PIN = 2;
const int PIR_PIN = 3;
const int MIC_PIN = A0;
const int LED_RED = 7;
const int LED_GREEN = 8;
const int BUZZER_PIN = 9;

// Sensor values
float temperature = 0;
float humidity = 0;
int motionDetected = 0;
int soundLevel = 0;
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 3000;

// Coimbatore locations
struct Location {
  const char* name;
  float lat;
  float lng;
};

Location coimbatoreLocations[8] = {
  {"Coimbatore Railway Station", 11.0180, 76.9555},
  {"PSG Tech", 11.0168, 76.9558},
  {"Coimbatore Medical College", 11.0069, 76.9666},
  {"Tidel Park", 11.0137, 76.9585},
  {"Race Course", 11.0055, 76.9637},
  {"Gandhipuram", 11.0100, 76.9600},
  {"Saravanampatti", 11.0650, 76.9520},
  {"Ukkadam", 10.9900, 76.9600}
};

void setup() {
  Serial.begin(9600);
  
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Coimbatore Safe");
  lcd.setCursor(0, 1);
  lcd.print("AI Monitor v1.0");
  
  delay(2000);
  lcd.clear();
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    sendSensorData();
    updateDisplay();
    lastSensorRead = currentTime;
  }
  
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    processCommand(command);
  }
  
  delay(100);
}

void readSensors() {
  // Simulate realistic Coimbatore environmental data
  temperature = 25.0 + (random(0, 150) / 10.0); // 25-40°C typical for Coimbatore
  humidity = 40.0 + (random(0, 400) / 10.0);    // 40-80% humidity
  motionDetected = digitalRead(PIR_PIN);
  soundLevel = analogRead(MIC_PIN);
  
  // Simulate urban events (higher probability during "peak hours")
  int hour = (millis() / 3600000) % 24;
  bool isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
  int eventProbability = isPeakHour ? 30 : 15; // Higher probability during peak hours
  
  if (random(0, 100) < eventProbability) {
    motionDetected = 1;
    soundLevel = random(700, 1024);
  }
}

void sendSensorData() {
  int locIndex = random(0, 8);
  Location loc = coimbatoreLocations[locIndex];
  
  // Send environmental data
  Serial.print("{");
  Serial.print("\"sensor\":\"coimbatore_env_");
  Serial.print(locIndex);
  Serial.print("\",");
  Serial.print("\"type\":\"environment\",");
  Serial.print("\"location\":{");
  Serial.print("\"name\":\"");
  Serial.print(loc.name);
  Serial.print("\",\"lat\":");
  Serial.print(loc.lat, 6);
  Serial.print(",\"lng\":");
  Serial.print(loc.lng, 6);
  Serial.print("},");
  Serial.print("\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"humidity\":");
  Serial.print(humidity, 1);
  Serial.print(",\"motion\":");
  Serial.print(motionDetected);
  Serial.print(",\"sound\":");
  Serial.print(soundLevel);
  Serial.print(",\"timestamp\":");
  Serial.print(millis());
  Serial.println("}");
  
  // Send individual event data if detected
  if (motionDetected) {
    Serial.print("{\"sensor\":\"coimbatore_motion_");
    Serial.print(locIndex);
    Serial.print("\",\"type\":\"motion\",\"value\":1,\"location\":{\"lat\":");
    Serial.print(loc.lat, 6);
    Serial.print(",\"lng\":");
    Serial.print(loc.lng, 6);
    Serial.print("},\"timestamp\":");
    Serial.print(millis());
    Serial.println("}");
    
    // Trigger visual alert
    digitalWrite(LED_RED, HIGH);
    delay(500);
    digitalWrite(LED_RED, LOW);
  }
  
  if (soundLevel > 650) {
    Serial.print("{\"sensor\":\"coimbatore_audio_");
    Serial.print(locIndex);
    Serial.print("\",\"type\":\"microphone\",\"value\":");
    Serial.print(soundLevel);
    Serial.print(",\"location\":{\"lat\":");
    Serial.print(loc.lat, 6);
    Serial.print(",\"lng\":");
    Serial.print(loc.lng, 6);
    Serial.print("},\"timestamp\":");
    Serial.print(millis());
    Serial.println("}");
    
    // Trigger audio alert for high noise
    if (soundLevel > 800) {
      tone(BUZZER_PIN, 1500, 300);
    }
  }
}

void processCommand(String command) {
  command.trim();
  command.toLowerCase();
  
  if (command == "status") {
    Serial.println("{\"system\":\"coimbatore_urban_guard\",\"status\":\"active\",\"city\":\"Coimbatore\"}");
  } else if (command == "test_alert") {
    triggerTestAlert();
  } else if (command == "locations") {
    Serial.println("{\"city\":\"Coimbatore\",\"total_locations\":8}");
    for (int i = 0; i < 8; i++) {
      Serial.print("{\"location\":\"");
      Serial.print(coimbatoreLocations[i].name);
      Serial.print("\",\"lat\":");
      Serial.print(coimbatoreLocations[i].lat, 6);
      Serial.print(",\"lng\":");
      Serial.print(coimbatoreLocations[i].lng, 6);
      Serial.println("}");
    }
  }
}

void triggerTestAlert() {
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER_PIN, 2000, 1000);
  
  Serial.println("{\"alert\":\"system_test\",\"message\":\"Coimbatore safety system test\",\"timestamp\":");
  Serial.print(millis());
  Serial.println("}");
  
  lcd.setCursor(0, 1);
  lcd.print("SYSTEM TEST    ");
  delay(2000);
  digitalWrite(LED_RED, LOW);
  lcd.setCursor(0, 1);
  lcd.print("                ");
}

void updateDisplay() {
  lcd.setCursor(0, 0);
  lcd.print("CBE:");
  lcd.print(temperature, 1);
  lcd.print("C ");
  lcd.print(humidity, 0);
  lcd.print("%");
  
  lcd.setCursor(0, 1);
  if (motionDetected) {
    lcd.print("ALERT:MOTION   ");
    digitalWrite(LED_GREEN, LOW);
  } else if (soundLevel > 700) {
    lcd.print("ALERT:NOISE    ");
    digitalWrite(LED_GREEN, LOW);
  } else {
    lcd.print("STATUS:NORMAL  ");
    digitalWrite(LED_GREEN, HIGH);
  }
}