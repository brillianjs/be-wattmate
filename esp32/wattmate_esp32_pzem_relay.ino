/*
 * WattMate ESP32 - PZEM + Relay Version
 * 
 * Hardware yang didukung:
 * - ESP32 Development Board (any variant)
 * - PZEM-004T V3.0 Energy Meter Module
 * - Relay 1 Channel Module (3.3V/5V compatible)
 * 
 * Features:
 * - Real-time electricity monitoring (V, A, W, kWh, PF, Hz)
 * - Remote relay control via Serial commands
 * - Auto safety protection (overvoltage, overcurrent, overpower)
 * - WiFi connectivity + API integration
 * - Serial commands: ON, OFF, STATUS, RESET, HELP
 * 
 * Wiring:
 * ESP32 5V    → PZEM VCC, Relay VCC
 * ESP32 GND   → PZEM GND, Relay GND
 * ESP32 GPIO16→ PZEM RX
 * ESP32 GPIO17→ PZEM TX  
 * ESP32 GPIO18→ Relay IN
 * ESP32 GPIO2 → Built-in LED (status)
 * 
 * SAFETY WARNING: 220V AC is dangerous! Test with low voltage first.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

// ===========================
// KONFIGURASI WIFI & API
// ===========================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiUrl = "http://192.168.1.100:3001/api/monitoring/data";
const char* deviceSerial = "WATT001"; // Ganti dengan serial device Anda

// ===========================
// KONFIGURASI PIN
// ===========================
#define PZEM_RX_PIN 16    // RX pin untuk PZEM
#define PZEM_TX_PIN 17    // TX pin untuk PZEM
#define RELAY_PIN 18      // Pin control relay
#define LED_PIN 2         // Built-in LED ESP32

// ===========================
// KONFIGURASI SAFETY
// ===========================
const float MAX_VOLTAGE = 250.0;     // Voltage maksimal (V)
const float MAX_CURRENT = 20.0;      // Current maksimal (A)
const float MAX_POWER = 4000.0;      // Power maksimal (W)
const float MIN_VOLTAGE = 180.0;     // Voltage minimal (V)

// ===========================
// INISIALISASI
// ===========================
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

// ===========================
// VARIABEL GLOBAL
// ===========================
unsigned long lastSensorRead = 0;
unsigned long lastAPICall = 0;
const unsigned long SENSOR_INTERVAL = 2000;  // Baca sensor setiap 2 detik
const unsigned long API_INTERVAL = 30000;    // Kirim ke API setiap 30 detik

bool relayState = false;
bool safetyTripped = false;
int consecutiveErrors = 0;

struct ElectricityData {
  float voltage;
  float current;
  float power;
  float energy;
  float powerFactor;
  float frequency;
  bool isValid;
  unsigned long timestamp;
};

ElectricityData currentData;

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== WattMate ESP32 - PZEM + Relay ===");
  
  // Setup pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  
  // Initial state - relay OFF untuk safety
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  relayState = false;
  
  // Setup WiFi
  setupWiFi();
  
  // Setup PZEM
  setupPZEM();
  
  // Test relay
  testRelay();
  
  Serial.println("=== Setup Completed ===");
  Serial.println("Commands via Serial:");
  Serial.println("'ON' - Turn relay ON");
  Serial.println("'OFF' - Turn relay OFF");
  Serial.println("'STATUS' - Show status");
  Serial.println("'RESET' - Reset safety trip");
  
  digitalWrite(LED_PIN, HIGH); // Ready indicator
}

void loop() {
  // Cek koneksi WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    setupWiFi();
    return;
  }
  
  // Baca sensor setiap SENSOR_INTERVAL
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    checkSafety();
    lastSensorRead = millis();
  }
  
  // Kirim data ke API setiap API_INTERVAL
  if (millis() - lastAPICall >= API_INTERVAL && currentData.isValid) {
    sendDataToAPI();
    lastAPICall = millis();
  }
  
  // Handle serial commands
  handleSerialCommands();
  
  delay(100);
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("✅ WiFi connected!");
  Serial.print("📡 IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("📶 Signal strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void setupPZEM() {
  Serial.println("🔌 Initializing PZEM-004T...");
  
  // Test komunikasi dengan PZEM
  delay(1000);
  float testVoltage = pzem.voltage();
  
  if (!isnan(testVoltage) && testVoltage > 0) {
    Serial.println("✅ PZEM-004T detected and working");
    Serial.printf("📊 Current voltage: %.2f V\n", testVoltage);
  } else {
    Serial.println("❌ PZEM-004T not responding - check wiring!");
    Serial.println("🔧 Wiring should be:");
    Serial.println("   ESP32 GPIO16 → PZEM RX");
    Serial.println("   ESP32 GPIO17 → PZEM TX");
    Serial.println("   ESP32 GND → PZEM GND");
    Serial.println("   ESP32 3.3V → PZEM VCC");
  }
}

void testRelay() {
  Serial.println("🔧 Testing relay...");
  
  // Test relay ON
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("📤 Relay ON");
  delay(1000);
  
  // Test relay OFF
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("📥 Relay OFF");
  relayState = false;
  
  Serial.println("✅ Relay test completed");
}

void readSensors() {
  // Baca data dari PZEM-004T
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();
  float frequency = pzem.frequency();
  float powerFactor = pzem.pf();
  
  // Validasi data
  if (!isnan(voltage) && !isnan(current) && !isnan(power) && !isnan(energy)) {
    currentData.voltage = voltage;
    currentData.current = current;
    currentData.power = power;
    currentData.energy = energy;
    currentData.frequency = isnan(frequency) ? 50.0 : frequency;
    currentData.powerFactor = isnan(powerFactor) ? 1.0 : powerFactor;
    currentData.isValid = true;
    currentData.timestamp = millis();
    consecutiveErrors = 0;
    
    // Print setiap 10 kali baca (setiap 20 detik)
    static int printCounter = 0;
    if (++printCounter >= 10) {
      printSensorData();
      printCounter = 0;
    }
  } else {
    currentData.isValid = false;
    consecutiveErrors++;
    
    if (consecutiveErrors >= 5) {
      Serial.println("❌ Multiple PZEM read errors - check connection!");
      consecutiveErrors = 0;
    }
  }
}

void printSensorData() {
  Serial.println("\n📊 === Current Readings ===");
  Serial.printf("⚡ Voltage: %.2f V\n", currentData.voltage);
  Serial.printf("🔌 Current: %.3f A\n", currentData.current);
  Serial.printf("💡 Power: %.2f W\n", currentData.power);
  Serial.printf("⚖️ Energy: %.4f kWh\n", currentData.energy);
  Serial.printf("🌊 Frequency: %.2f Hz\n", currentData.frequency);
  Serial.printf("📐 Power Factor: %.3f\n", currentData.powerFactor);
  Serial.printf("🔗 Relay: %s\n", relayState ? "ON" : "OFF");
  Serial.printf("🛡️ Safety: %s\n", safetyTripped ? "TRIPPED" : "OK");
  Serial.println("========================");
}

void checkSafety() {
  if (!currentData.isValid || safetyTripped) return;
  
  bool shouldTrip = false;
  String reason = "";
  
  // Cek overvoltage
  if (currentData.voltage > MAX_VOLTAGE) {
    shouldTrip = true;
    reason = "OVERVOLTAGE: " + String(currentData.voltage) + "V > " + String(MAX_VOLTAGE) + "V";
  }
  // Cek undervoltage
  else if (currentData.voltage < MIN_VOLTAGE) {
    shouldTrip = true;
    reason = "UNDERVOLTAGE: " + String(currentData.voltage) + "V < " + String(MIN_VOLTAGE) + "V";
  }
  // Cek overcurrent
  else if (currentData.current > MAX_CURRENT) {
    shouldTrip = true;
    reason = "OVERCURRENT: " + String(currentData.current) + "A > " + String(MAX_CURRENT) + "A";
  }
  // Cek overpower
  else if (currentData.power > MAX_POWER) {
    shouldTrip = true;
    reason = "OVERPOWER: " + String(currentData.power) + "W > " + String(MAX_POWER) + "W";
  }
  
  if (shouldTrip) {
    tripSafety(reason);
  }
}

void tripSafety(String reason) {
  Serial.println("\n🚨 === SAFETY TRIP ===");
  Serial.println("⚠️ Reason: " + reason);
  Serial.println("📥 Turning OFF relay for safety");
  
  // Turn OFF relay immediately
  setRelay(false);
  safetyTripped = true;
  
  // Blink LED untuk warning
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
    delay(100);
  }
  
  Serial.println("🔧 Use 'RESET' command to clear safety trip");
  Serial.println("==================");
}

void setRelay(bool state) {
  if (safetyTripped && state) {
    Serial.println("❌ Cannot turn ON relay - safety tripped!");
    return;
  }
  
  digitalWrite(RELAY_PIN, state ? HIGH : LOW);
  relayState = state;
  
  Serial.printf("🔗 Relay %s\n", state ? "ON" : "OFF");
  
  // Blink LED untuk feedback
  for (int i = 0; i < (state ? 2 : 1); i++) {
    digitalWrite(LED_PIN, LOW);
    delay(150);
    digitalWrite(LED_PIN, HIGH);
    delay(150);
  }
}

void sendDataToAPI() {
  if (!currentData.isValid) {
    Serial.println("⚠️ No valid data to send");
    return;
  }
  
  Serial.println("\n📡 Sending data to API...");
  
  HTTPClient http;
  String url = String(apiUrl) + "/" + String(deviceSerial);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 detik timeout
  
  // Buat JSON payload
  DynamicJsonDocument doc(512);
  doc["voltage"] = roundToDecimal(currentData.voltage, 2);
  doc["current_ampere"] = roundToDecimal(currentData.current, 3);
  doc["power_watts"] = roundToDecimal(currentData.power, 2);
  doc["energy_kwh"] = roundToDecimal(currentData.energy, 4);
  doc["power_factor"] = roundToDecimal(currentData.powerFactor, 3);
  doc["frequency"] = roundToDecimal(currentData.frequency, 2);
  doc["temperature"] = 25.0; // Default temperature
  
  // Tambahan info relay dan safety
  doc["relay_state"] = relayState;
  doc["safety_status"] = safetyTripped ? "TRIPPED" : "OK";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Kirim POST request
  int httpResponseCode = http.POST(jsonString);
  String response = http.getString();
  
  if (httpResponseCode == 201) {
    Serial.println("✅ Data sent successfully!");
    
    // Parse response untuk cek command dari server
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    // Blink LED untuk sukses
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
    
  } else {
    Serial.printf("❌ Failed to send data - HTTP %d\n", httpResponseCode);
    Serial.println("Response: " + response);
    
    // Blink LED untuk error
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, LOW);
      delay(100);
      digitalWrite(LED_PIN, HIGH);
      delay(100);
    }
  }
  
  http.end();
}

void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    if (command == "ON") {
      setRelay(true);
    }
    else if (command == "OFF") {
      setRelay(false);
    }
    else if (command == "STATUS") {
      printStatus();
    }
    else if (command == "RESET") {
      resetSafety();
    }
    else if (command == "HELP") {
      printHelp();
    }
    else {
      Serial.println("❌ Unknown command: " + command);
      Serial.println("Type 'HELP' for available commands");
    }
  }
}

void printStatus() {
  Serial.println("\n📋 === Device Status ===");
  Serial.printf("📡 WiFi: %s (IP: %s)\n", 
    WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected",
    WiFi.localIP().toString().c_str());
  Serial.printf("🔗 Relay: %s\n", relayState ? "ON" : "OFF");
  Serial.printf("🛡️ Safety: %s\n", safetyTripped ? "TRIPPED" : "OK");
  Serial.printf("📊 Data: %s\n", currentData.isValid ? "Valid" : "Invalid");
  Serial.printf("⏱️ Uptime: %lu ms\n", millis());
  Serial.printf("💾 Free Heap: %d bytes\n", ESP.getFreeHeap());
  
  if (currentData.isValid) {
    Serial.printf("⚡ Last Reading: %.2fV, %.3fA, %.2fW\n", 
      currentData.voltage, currentData.current, currentData.power);
  }
  Serial.println("=====================");
}

void resetSafety() {
  safetyTripped = false;
  Serial.println("✅ Safety trip reset");
  Serial.println("🔧 Relay can now be controlled again");
}

void printHelp() {
  Serial.println("\n📖 === Available Commands ===");
  Serial.println("ON      - Turn relay ON");
  Serial.println("OFF     - Turn relay OFF");
  Serial.println("STATUS  - Show device status");
  Serial.println("RESET   - Reset safety trip");
  Serial.println("HELP    - Show this help");
  Serial.println("============================");
}

float roundToDecimal(float value, int decimals) {
  float multiplier = pow(10.0, decimals);
  return round(value * multiplier) / multiplier;
}
