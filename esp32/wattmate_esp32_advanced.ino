/*
 * WattMate ESP32 - Advanced Version dengan OTA & Deep Sleep
 * 
 * Fitur lengkap:
 * - Over The Air (OTA) updates
 * - Deep Sleep untuk hemat baterai
 * - Watchdog timer
 * - Data buffering
 * - Error recovery
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <PZEM004Tv30.h>
#include <Preferences.h>
#include <esp_task_wdt.h>

// ===========================
// KONFIGURASI
// ===========================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiUrl = "http://your-domain.com/api/monitoring/data";
const char* deviceSerial = "WATT003";
const char* otaPassword = "wattmate2024";

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
#define LED_PIN 2
#define BUTTON_PIN 0

// Timing
const unsigned long READING_INTERVAL = 60000;    // 1 menit
const unsigned long DEEP_SLEEP_TIME = 300;       // 5 menit (detik)
const unsigned long WIFI_TIMEOUT = 30000;        // 30 detik
const unsigned long WDT_TIMEOUT = 120;           // 2 menit watchdog

// ===========================
// GLOBAL VARIABLES
// ===========================
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
Preferences preferences;

struct DataBuffer {
  float voltage;
  float current;
  float power;
  float energy;
  float powerFactor;
  float frequency;
  float temperature;
  unsigned long timestamp;
  bool sent;
};

DataBuffer dataBuffer[10]; // Buffer untuk 10 readings
int bufferIndex = 0;
int retryCount = 0;
bool deepSleepEnabled = true;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== WattMate ESP32 Advanced ===");
  
  // Setup pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Cek wake up reason
  checkWakeupReason();
  
  // Setup Watchdog
  esp_task_wdt_init(WDT_TIMEOUT, true);
  esp_task_wdt_add(NULL);
  
  // Load preferences
  preferences.begin("wattmate", false);
  retryCount = preferences.getInt("retryCount", 0);
  
  // Setup WiFi
  if (!setupWiFi()) {
    Serial.println("WiFi failed, going to sleep...");
    goToDeepSleep();
  }
  
  // Setup OTA
  setupOTA();
  
  // Setup PZEM
  setupPZEM();
  
  // Load buffered data
  loadBufferedData();
  
  Serial.println("Setup completed!");
  
  // Reset watchdog
  esp_task_wdt_reset();
}

void loop() {
  // Handle OTA
  ArduinoOTA.handle();
  
  // Reset watchdog
  esp_task_wdt_reset();
  
  // Cek button untuk disable deep sleep
  if (digitalRead(BUTTON_PIN) == LOW) {
    deepSleepEnabled = false;
    Serial.println("Deep sleep disabled by button");
    delay(1000);
  }
  
  // Baca dan kirim data
  if (readAndSendData()) {
    retryCount = 0;
    preferences.putInt("retryCount", retryCount);
  } else {
    retryCount++;
    preferences.putInt("retryCount", retryCount);
    
    if (retryCount >= 5) {
      Serial.println("Too many failures, restarting...");
      ESP.restart();
    }
  }
  
  // Send buffered data
  sendBufferedData();
  
  // Deep sleep jika enabled
  if (deepSleepEnabled) {
    goToDeepSleep();
  } else {
    delay(READING_INTERVAL);
  }
}

bool setupWiFi() {
  WiFi.begin(ssid, password);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < WIFI_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("\nWiFi connection failed!");
    return false;
  }
}

void setupOTA() {
  ArduinoOTA.setPassword(otaPassword);
  
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else {
      type = "filesystem";
    }
    Serial.println("Start updating " + type);
  });
  
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
    }
  });
  
  ArduinoOTA.begin();
  Serial.println("OTA Ready");
}

void setupPZEM() {
  // Test PZEM communication
  float voltage = pzem.voltage();
  if (!isnan(voltage)) {
    Serial.println("PZEM-004T detected and working");
  } else {
    Serial.println("PZEM-004T not responding");
  }
}

bool readAndSendData() {
  Serial.println("\n--- Reading Data ---");
  
  // Baca dari PZEM
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();
  float frequency = pzem.frequency();
  float powerFactor = pzem.pf();
  float temperature = 25.0; // Atau dari sensor temperature
  
  // Validasi data
  if (isnan(voltage) || isnan(current) || isnan(power) || isnan(energy)) {
    Serial.println("Invalid sensor data, buffering...");
    bufferData(220.0, 0.0, 0.0, energy, 1.0, 50.0, temperature);
    return false;
  }
  
  Serial.printf("V:%.2f, I:%.3f, P:%.2f, E:%.4f\n", voltage, current, power, energy);
  
  // Kirim ke API
  if (sendToAPI(voltage, current, power, energy, powerFactor, frequency, temperature)) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    return true;
  } else {
    // Buffer data jika gagal kirim
    bufferData(voltage, current, power, energy, powerFactor, frequency, temperature);
    return false;
  }
}

bool sendToAPI(float voltage, float current, float power, float energy,
               float powerFactor, float frequency, float temperature) {
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return false;
  }
  
  HTTPClient http;
  http.setTimeout(10000); // 10 detik timeout
  
  String url = String(apiUrl) + "/" + String(deviceSerial);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Buat JSON payload
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
  
  int responseCode = http.POST(jsonString);
  String response = http.getString();
  
  http.end();
  
  if (responseCode == 201) {
    Serial.println("✅ Data sent successfully");
    return true;
  } else {
    Serial.printf("❌ Failed: HTTP %d\n", responseCode);
    Serial.println(response);
    return false;
  }
}

void bufferData(float voltage, float current, float power, float energy,
                float powerFactor, float frequency, float temperature) {
  
  if (bufferIndex >= 10) {
    bufferIndex = 0; // Overwrite oldest data
  }
  
  dataBuffer[bufferIndex] = {
    voltage, current, power, energy, powerFactor, frequency, temperature,
    millis(), false
  };
  
  bufferIndex++;
  saveBufferedData();
  
  Serial.printf("Data buffered at index %d\n", bufferIndex - 1);
}

void sendBufferedData() {
  for (int i = 0; i < 10; i++) {
    if (dataBuffer[i].timestamp > 0 && !dataBuffer[i].sent) {
      if (sendToAPI(dataBuffer[i].voltage, dataBuffer[i].current,
                    dataBuffer[i].power, dataBuffer[i].energy,
                    dataBuffer[i].powerFactor, dataBuffer[i].frequency,
                    dataBuffer[i].temperature)) {
        
        dataBuffer[i].sent = true;
        Serial.printf("✅ Buffered data %d sent\n", i);
      }
    }
  }
}

void saveBufferedData() {
  // Save to preferences (simplified, in real implementation use SPIFFS)
  preferences.putBytes("buffer", dataBuffer, sizeof(dataBuffer));
}

void loadBufferedData() {
  // Load from preferences
  preferences.getBytes("buffer", dataBuffer, sizeof(dataBuffer));
}

void checkWakeupReason() {
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  
  switch(wakeup_reason) {
    case ESP_SLEEP_WAKEUP_TIMER:
      Serial.println("Wakeup caused by timer");
      break;
    case ESP_SLEEP_WAKEUP_EXT0:
      Serial.println("Wakeup caused by external signal using RTC_IO");
      break;
    default:
      Serial.printf("Wakeup was not caused by deep sleep: %d\n", wakeup_reason);
      break;
  }
}

void goToDeepSleep() {
  Serial.printf("Going to sleep for %d seconds...\n", DEEP_SLEEP_TIME);
  
  // Save data
  preferences.end();
  
  // Setup wakeup
  esp_sleep_enable_timer_wakeup(DEEP_SLEEP_TIME * 1000000ULL);
  
  // Go to sleep
  esp_deep_sleep_start();
}
