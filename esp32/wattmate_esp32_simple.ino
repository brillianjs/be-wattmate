/*
 * WattMate ESP32 - Versi Sederhana (Tanpa PZEM)
 * 
 * Script untuk ESP32 dengan sensor terpisah
 * Cocok untuk prototype atau jika tidak memiliki PZEM-004T
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===========================
// KONFIGURASI WIFI & API
// ===========================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiUrl = "http://192.168.1.100:3001/api/monitoring/data"; // Ganti dengan IP server Anda
const char* deviceSerial = "WATT002"; // Ganti dengan serial device Anda

// ===========================
// KONFIGURASI PIN
// ===========================
#define VOLTAGE_PIN A0     // Pin analog untuk sensor tegangan
#define CURRENT_PIN A1     // Pin analog untuk sensor arus
#define LED_PIN 2

// ===========================
// KONSTANTA KALIBRASI
// ===========================
const float VOLTAGE_MULTIPLIER = 0.25;  // Sesuaikan dengan sensor voltage divider
const float CURRENT_MULTIPLIER = 0.185; // Sesuaikan dengan sensor ACS712
const float VOLTAGE_OFFSET = 2.5;       // Offset untuk sensor
const float CURRENT_OFFSET = 2.5;       // Offset untuk sensor

// ===========================
// VARIABEL GLOBAL
// ===========================
unsigned long lastReading = 0;
const unsigned long READING_INTERVAL = 30000; // 30 detik

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== WattMate ESP32 Simple Version ===");
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Setup WiFi
  setupWiFi();
  
  Serial.println("Setup completed!");
  digitalWrite(LED_PIN, HIGH);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
    return;
  }
  
  if (millis() - lastReading >= READING_INTERVAL) {
    readAndSendData();
    lastReading = millis();
  }
  
  delay(1000);
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void readAndSendData() {
  Serial.println("\n--- Reading Sensors ---");
  
  // Baca sensor (simulasi atau sensor real)
  float voltage = readVoltage();
  float current = readCurrent();
  float power = voltage * current;
  float energy = power * (READING_INTERVAL / 1000.0) / 3600000.0; // kWh
  float powerFactor = 0.85; // Asumsi power factor
  float frequency = 50.0;   // Asumsi frequency
  float temperature = 25.0 + random(-5, 10); // Simulasi temperature
  
  Serial.printf("Voltage: %.2f V\n", voltage);
  Serial.printf("Current: %.3f A\n", current);
  Serial.printf("Power: %.2f W\n", power);
  Serial.printf("Energy: %.6f kWh\n", energy);
  
  // Kirim ke API
  sendToAPI(voltage, current, power, energy, powerFactor, frequency, temperature);
}

float readVoltage() {
  // Baca dari sensor voltage atau simulasi
  int sensorValue = analogRead(VOLTAGE_PIN);
  float voltage = (sensorValue * 3.3 / 4095.0 - VOLTAGE_OFFSET) / VOLTAGE_MULTIPLIER;
  
  // Simulasi jika tidak ada sensor
  if (voltage < 0 || voltage > 300) {
    voltage = 220.0 + random(-10, 10); // Simulasi 220V ± 10V
  }
  
  return voltage;
}

float readCurrent() {
  // Baca dari sensor current atau simulasi
  int sensorValue = analogRead(CURRENT_PIN);
  float current = abs((sensorValue * 3.3 / 4095.0 - CURRENT_OFFSET) / CURRENT_MULTIPLIER);
  
  // Simulasi jika tidak ada sensor
  if (current < 0 || current > 50) {
    current = 2.5 + (random(0, 1000) / 1000.0); // Simulasi 2.5-3.5A
  }
  
  return current;
}

void sendToAPI(float voltage, float current, float power, float energy, 
               float powerFactor, float frequency, float temperature) {
  
  Serial.println("--- Sending to API ---");
  
  HTTPClient http;
  String url = String(apiUrl) + "/" + String(deviceSerial);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Buat JSON
  DynamicJsonDocument doc(512);
  doc["voltage"] = round(voltage * 100) / 100.0;
  doc["current_ampere"] = round(current * 1000) / 1000.0;
  doc["power_watts"] = round(power * 100) / 100.0;
  doc["energy_kwh"] = round(energy * 10000) / 10000.0;
  doc["power_factor"] = round(powerFactor * 1000) / 1000.0;
  doc["frequency"] = round(frequency * 100) / 100.0;
  doc["temperature"] = round(temperature * 100) / 100.0;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("JSON: " + jsonString);
  
  int responseCode = http.POST(jsonString);
  String response = http.getString();
  
  Serial.printf("Response Code: %d\n", responseCode);
  Serial.println("Response: " + response);
  
  if (responseCode == 201) {
    Serial.println("✅ Success!");
    blinkLED(2, 200);
  } else {
    Serial.println("❌ Failed!");
    blinkLED(5, 100);
  }
  
  http.end();
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
  }
}
