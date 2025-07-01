/*
 * WattMate ESP32 - Smart Electricity Monitoring
 * 
 * Script untuk ESP32 yang membaca data listrik dari sensor
 * dan mengirim ke API WattMate Backend
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - PZEM-004T V3.0 (Energy Meter Module)
 * - ACS712 Current Sensor (optional, jika tidak pakai PZEM)
 * - ZMPT101B Voltage Sensor (optional, jika tidak pakai PZEM)
 * - DS18B20 Temperature Sensor (optional)
 * 
 * Libraries Required:
 * - WiFi
 * - HTTPClient
 * - ArduinoJson
 * - PZEM004Tv30 (by Jakub Mandula)
 * - OneWire & DallasTemperature (untuk DS18B20)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ===========================
// KONFIGURASI WIFI & API
// ===========================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiUrl = "http://your-api-domain.com/api/monitoring/data";
const char* deviceSerial = "WATT001"; // Ganti dengan serial device Anda

// ===========================
// KONFIGURASI PIN
// ===========================
#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
#define TEMP_SENSOR_PIN 4
#define LED_PIN 2

// ===========================
// INISIALISASI SENSOR
// ===========================
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensor(&oneWire);

// ===========================
// VARIABEL GLOBAL
// ===========================
unsigned long lastSensorRead = 0;
unsigned long lastAPICall = 0;
const unsigned long SENSOR_INTERVAL = 5000;  // Baca sensor setiap 5 detik
const unsigned long API_INTERVAL = 30000;    // Kirim ke API setiap 30 detik

struct ElectricityData {
  float voltage;
  float current;
  float power;
  float energy;
  float powerFactor;
  float frequency;
  float temperature;
  bool isValid;
};

ElectricityData currentData;

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== WattMate ESP32 Started ===");
  
  // Setup LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Setup WiFi
  setupWiFi();
  
  // Setup Sensors
  setupSensors();
  
  Serial.println("Setup completed!");
  digitalWrite(LED_PIN, HIGH); // LED on when ready
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
    lastSensorRead = millis();
  }
  
  // Kirim data ke API setiap API_INTERVAL
  if (millis() - lastAPICall >= API_INTERVAL && currentData.isValid) {
    sendDataToAPI();
    lastAPICall = millis();
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
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void setupSensors() {
  // Setup PZEM-004T
  Serial.println("Initializing PZEM-004T...");
  
  // Reset energy counter (optional, hanya untuk testing)
  // pzem.resetEnergy();
  
  // Setup temperature sensor
  temperatureSensor.begin();
  
  Serial.println("Sensors initialized!");
}

void readSensors() {
  Serial.println("\n--- Reading Sensors ---");
  
  // Reset data
  currentData.isValid = false;
  
  // Baca data dari PZEM-004T
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();
  float frequency = pzem.frequency();
  float powerFactor = pzem.pf();
  
  // Baca temperature
  temperatureSensor.requestTemperatures();
  float temperature = temperatureSensor.getTempCByIndex(0);
  
  // Validasi data PZEM
  if (!isnan(voltage) && !isnan(current) && !isnan(power) && !isnan(energy)) {
    currentData.voltage = voltage;
    currentData.current = current;
    currentData.power = power;
    currentData.energy = energy;
    currentData.frequency = isnan(frequency) ? 50.0 : frequency;
    currentData.powerFactor = isnan(powerFactor) ? 1.0 : powerFactor;
    currentData.temperature = isnan(temperature) ? 25.0 : temperature;
    currentData.isValid = true;
    
    // Print data ke Serial Monitor
    Serial.printf("Voltage: %.2f V\n", currentData.voltage);
    Serial.printf("Current: %.3f A\n", currentData.current);
    Serial.printf("Power: %.2f W\n", currentData.power);
    Serial.printf("Energy: %.4f kWh\n", currentData.energy);
    Serial.printf("Frequency: %.2f Hz\n", currentData.frequency);
    Serial.printf("Power Factor: %.3f\n", currentData.powerFactor);
    Serial.printf("Temperature: %.2f °C\n", currentData.temperature);
  } else {
    Serial.println("ERROR: Failed to read PZEM data!");
    
    // Coba reset komunikasi PZEM
    Serial.println("Attempting to reset PZEM communication...");
    delay(1000);
  }
}

void sendDataToAPI() {
  if (!currentData.isValid) {
    Serial.println("No valid data to send");
    return;
  }
  
  Serial.println("\n--- Sending Data to API ---");
  
  HTTPClient http;
  String url = String(apiUrl) + "/" + String(deviceSerial);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Buat JSON payload
  DynamicJsonDocument doc(1024);
  doc["voltage"] = roundToDecimal(currentData.voltage, 2);
  doc["current_ampere"] = roundToDecimal(currentData.current, 3);
  doc["power_watts"] = roundToDecimal(currentData.power, 2);
  doc["energy_kwh"] = roundToDecimal(currentData.energy, 4);
  doc["power_factor"] = roundToDecimal(currentData.powerFactor, 3);
  doc["frequency"] = roundToDecimal(currentData.frequency, 2);
  doc["temperature"] = roundToDecimal(currentData.temperature, 2);
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("JSON Payload:");
  Serial.println(jsonString);
  
  // Kirim POST request
  int httpResponseCode = http.POST(jsonString);
  String response = http.getString();
  
  Serial.printf("HTTP Response Code: %d\n", httpResponseCode);
  Serial.println("Response:");
  Serial.println(response);
  
  if (httpResponseCode == 201) {
    Serial.println("✅ Data sent successfully!");
    blinkLED(2, 200); // Blink 2 kali untuk sukses
  } else if (httpResponseCode == 404) {
    Serial.println("❌ Device not found! Check device serial.");
    blinkLED(5, 100); // Blink 5 kali untuk error
  } else {
    Serial.println("❌ Failed to send data!");
    blinkLED(3, 300); // Blink 3 kali untuk gagal
  }
  
  http.end();
}

float roundToDecimal(float value, int decimals) {
  float multiplier = pow(10.0, decimals);
  return round(value * multiplier) / multiplier;
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
  }
}

// Fungsi untuk monitoring via Serial
void printWiFiStatus() {
  Serial.println("\n=== WiFi Status ===");
  Serial.printf("SSID: %s\n", WiFi.SSID().c_str());
  Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Signal: %d dBm\n", WiFi.RSSI());
  Serial.printf("Status: %s\n", WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
}

void printSystemInfo() {
  Serial.println("\n=== System Info ===");
  Serial.printf("Device Serial: %s\n", deviceSerial);
  Serial.printf("API URL: %s\n", apiUrl);
  Serial.printf("Uptime: %lu ms\n", millis());
  Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("Chip ID: %d\n", ESP.getEfuseMac());
}
