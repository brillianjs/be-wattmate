# WattMate ESP32 - Setup Guide

Panduan lengkap untuk setup ESP32 dengan WattMate API.

## 🚀 Quick Start (Untuk Hardware Anda)

**Hardware:** ESP32 + PZEM-004T + Relay 1 Channel

### Step 1: Download & Install

1. Download file: `wattmate_esp32_pzem_relay.ino`
2. Install Arduino IDE + ESP32 board package
3. Install libraries: ArduinoJson, PZEM-004T-v30

### Step 2: Wiring (HATI-HATI - 5V!)

```
ESP32    →  PZEM-004T    ESP32    →  Relay
GND      →  GND          GND      →  GND
5V       →  VCC          5V       →  VCC
GPIO16   →  RX           GPIO18   →  IN
GPIO17   →  TX
```

### Step 3: Configure

```cpp
// Edit di file .ino:
const char* ssid = "WiFi_Anda";
const char* password = "Password_WiFi";
const char* apiUrl = "http://IP_SERVER:3001/api/monitoring/data";
const char* deviceSerial = "WATT001"; // Unique ID
```

### Step 4: Upload & Test

1. Upload code ke ESP32
2. Open Serial Monitor (115200 baud)
3. Test commands: `STATUS`, `ON`, `OFF`
4. Cek data di API: `GET /api/devices`

**⚠️ WARNING: Gunakan 5V untuk PZEM & Relay, test dengan beban kecil dulu!**

---

## 📋 Hardware Requirements

### Minimum (Simple Version):

- ESP32 Development Board
- LED (built-in bisa digunakan)
- Resistor untuk voltage divider (opsional)

### PZEM + Relay Version (Sesuai Hardware Anda):

- ESP32 Development Board
- PZEM-004T V3.0 Energy Meter Module
- Relay 1 Channel Module
- Jumper wires

### Your Setup (PZEM + Relay):

- ESP32 Development Board
- PZEM-004T V3.0 Energy Meter Module
- Relay 1 Channel Module
- LED indicator (built-in bisa digunakan)
- Breadboard dan jumper wires

### Optional Additions:

- Push button untuk manual control
- External LED indicator
- OLED Display untuk status
- Enclosure untuk proteksi

## 📚 Required Libraries (Untuk Hardware Anda)

Install libraries berikut melalui Arduino IDE Library Manager:

```
1. WiFi (built-in ESP32)
2. HTTPClient (built-in ESP32)
3. ArduinoJson by Benoit Blanchon
4. PZEM004Tv30 by Jakub Mandula
```

**Note: OneWire dan DallasTemperature TIDAK diperlukan untuk setup Anda (hanya ESP32 + PZEM + Relay)**

### Install via Arduino IDE:

1. Buka Arduino IDE
2. Go to **Tools** → **Manage Libraries**
3. Search dan install:
   - ArduinoJson
   - PZEM-004T-v30

### Install via PlatformIO:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    bblanchon/ArduinoJson@^6.21.3
    mandulaj/PZEM-004T-v30@^1.1.2
```

## 🔌 Wiring Diagram (ESP32 + PZEM + Relay)

### PZEM-004T Connection:

```
ESP32    PZEM-004T
GND  →   GND
5V   →   VCC      (PZEM butuh 5V, bukan 3.3V!)
GPIO16 → RX       (ESP32 receives data from PZEM)
GPIO17 → TX       (ESP32 sends commands to PZEM)
```

### Relay 1 Channel Connection:

```
ESP32    Relay Module
GND  →   GND
5V   →   VCC      (Relay butuh 5V untuk optimal)
GPIO18 → IN       (Signal control)
```

### Power Supply (PENTING!):

```
ESP32 Board:
- Gunakan USB 5V atau external 5V adapter
- JANGAN gunakan 3.3V untuk PZEM dan Relay
- Built-in regulator ESP32 akan convert 5V → 3.3V untuk core
```

### Complete Wiring Diagram:

```
┌─────────────────────┐    ┌──────────────┐    ┌─────────────┐
│ ESP32 Dev Board     │    │ PZEM-004T    │    │ Relay 1Ch   │
│                     │    │              │    │             │
│ 5V  ────────────────┼────┼─ VCC         │    │ VCC ────────┼── 5V
│ GND ────────────────┼────┼─ GND         │    │ GND ────────┼── GND
│ GPIO16 (RX) ────────┼────┼─ TX          │    │             │
│ GPIO17 (TX) ────────┼────┼─ RX          │    │             │
│ GPIO18 ─────────────┼────┼──────────────┼────┼─ IN         │
│ GPIO2 (LED) ────────┼─── Built-in LED  │    │             │
└─────────────────────┘    └──────────────┘    └─────────────┘
                                                       │
                                                   AC LOAD
                                              (Lampu/Peralatan)
```

### LED Indicator (Built-in):

```
ESP32 GPIO2 (Built-in LED) - digunakan untuk status indicator
- Berkedip: Connecting to WiFi
- ON: Connected and sending data
- OFF: Error atau disconnected
```

## ⚠️ SAFETY WARNING - KEAMANAN LISTRIK

**PERINGATAN KERAS - HANYA UNTUK YANG BERPENGALAMAN!**

```
🚨 BAHAYA LISTRIK 220V/110V! 🚨

1. SELALU MATIKAN DAYA UTAMA sebelum wiring
2. PZEM-004T harus terisolasi dengan baik
3. RELAY mengendalikan ARUS TINGGI - gunakan enclosure
4. JANGAN sentuh terminal saat ada daya
5. GUNAKAN MCB/Fuse untuk proteksi
6. TEST di voltage rendah dulu (12V) sebelum 220V
7. GUNAKAN multimeter untuk verifikasi wiring

Jika tidak yakin - MINTA BANTUAN TEKNISI LISTRIK!
```

### Safe Testing Steps:

1. **Step 1**: Test ESP32 + PZEM tanpa relay (monitor saja)
2. **Step 2**: Test relay dengan LED 12V (bukan 220V)
3. **Step 3**: Baru test dengan beban 220V (lampu kecil)
4. **Step 4**: Test dengan beban sesungguhnya

## 🔌⚡ PZEM + Relay Setup (Hardware Anda)

### Wiring Lengkap:

```
ESP32 Board:
┌─────────────────────┐
│ ESP32               │
│                     │
│ GPIO16 ──────────── │ → PZEM RX
│ GPIO17 ──────────── │ → PZEM TX
│ GPIO18 ──────────── │ → Relay IN
│ GPIO2  ──────────── │ → Built-in LED
│ 3.3V   ──────────── │ → PZEM VCC & Relay VCC
│ GND    ──────────── │ → PZEM GND & Relay GND
└─────────────────────┘
```

### File Script untuk Setup Anda:

**Gunakan file: `wattmate_esp32_pzem_relay.ino`**

### Features Khusus:

- ✅ Monitoring listrik dengan PZEM-004T
- ✅ Control relay ON/OFF via Serial commands
- ✅ Safety protection (overvoltage, overcurrent, overpower)
- ✅ Auto relay OFF jika ada bahaya
- ✅ WiFi + API integration
- ✅ Real-time monitoring via Serial

### Serial Commands:

```
ON      - Turn relay ON
OFF     - Turn relay OFF
STATUS  - Show device status
RESET   - Reset safety trip
HELP    - Show available commands
```

### Safety Limits (dapat disesuaikan):

```cpp
const float MAX_VOLTAGE = 250.0;     // Voltage maksimal (V)
const float MAX_CURRENT = 20.0;      // Current maksimal (A)
const float MAX_POWER = 4000.0;      // Power maksimal (W)
const float MIN_VOLTAGE = 180.0;     // Voltage minimal (V)
```

### Expected Output:

```
=== WattMate ESP32 - PZEM + Relay ===
✅ WiFi connected!
📡 IP address: 192.168.1.150
✅ PZEM-004T detected and working
📊 Current voltage: 220.50 V
✅ Relay test completed

📊 === Current Readings ===
⚡ Voltage: 220.50 V
🔌 Current: 5.250 A
💡 Power: 1153.12 W
⚖️ Energy: 2.5432 kWh
🌊 Frequency: 50.00 Hz
📐 Power Factor: 0.850
🔗 Relay: OFF
🛡️ Safety: OK
========================
```

## ⚙️ Configuration

### 1. WiFi Settings:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. API Settings:

```cpp
const char* apiUrl = "http://192.168.1.100:3001/api/monitoring/data";
const char* deviceSerial = "WATT001"; // Unique untuk setiap device
```

### 3. Reading Intervals:

```cpp
const unsigned long SENSOR_INTERVAL = 5000;  // Baca sensor setiap 5 detik
const unsigned long API_INTERVAL = 30000;    // Kirim ke API setiap 30 detik
```

## 🚀 Upload Steps

### 1. Prepare Arduino IDE:

```
1. Install ESP32 Board Package:
   - File → Preferences
   - Additional Board Manager URLs:
     https://dl.espressif.com/dl/package_esp32_index.json
   - Tools → Board → Boards Manager
   - Search "ESP32" dan install

2. Select Board:
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
   - Tools → Port → (pilih port ESP32 Anda)
```

### 2. Configure Settings:

```
Tools → Board → ESP32 Dev Module
Tools → Upload Speed → 921600
Tools → CPU Frequency → 240MHz
Tools → Flash Frequency → 80MHz
Tools → Flash Mode → QIO
Tools → Flash Size → 4MB (32Mb)
Tools → Partition Scheme → Default 4MB
```

### 3. Upload Code:

```
1. Buka file .ino yang sesuai
2. Edit konfigurasi WiFi dan API
3. Verify (Ctrl+R)
4. Upload (Ctrl+U)
```

## 🔧 Troubleshooting

### WiFi Connection Issues:

```cpp
// Tambahkan debug WiFi
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
  Serial.printf("WiFi Status: %d\n", WiFi.status());
}
```

### PZEM Communication Issues:

```cpp
// Test PZEM communication
if (isnan(pzem.voltage())) {
  Serial.println("PZEM not responding - check wiring");
  // Reset communication
  delay(1000);
}
```

### API Connection Issues:

```cpp
// Tambahkan detail error
if (httpResponseCode != 201) {
  Serial.printf("HTTP Error: %d\n", httpResponseCode);
  Serial.println("Response: " + response);
}
```

## 📊 Monitoring & Debugging

### Serial Monitor Output:

```
=== WattMate ESP32 Started ===
Connecting to WiFi....
WiFi connected!
IP address: 192.168.1.150

--- Reading Sensors ---
Voltage: 220.50 V
Current: 5.250 A
Power: 1153.12 W
Energy: 2.5432 kWh
Frequency: 50.00 Hz
Power Factor: 0.850
Temperature: 35.50 °C

--- Sending Data to API ---
JSON Payload:
{"voltage":220.5,"current_ampere":5.25,"power_watts":1153.12,"energy_kwh":2.5432,"power_factor":0.85,"frequency":50,"temperature":35.5}
HTTP Response Code: 201
Response:
{"success":true,"message":"Data monitoring berhasil disimpan","data":{"reading":{"id":1,"device_id":1...}}}
✅ Data sent successfully!
```

### LED Status Indicators:

- **Solid ON**: ESP32 ready/connected
- **2 Blinks**: Data sent successfully
- **3 Blinks**: Failed to send data
- **5 Blinks**: Device not found (check serial)

## �️ Troubleshooting (ESP32 + PZEM + Relay)

### 1. PZEM-004T Issues:

**Problem: "PZEM not responding" atau pembacaan 0.00**

```
✅ Solutions:
- Cek wiring: RX/TX mungkin terbalik
- Gunakan 5V untuk PZEM (bukan 3.3V)
- Cek baudrate: 9600 (default PZEM)
- Test PZEM dengan module lain dulu
- Pastikan PZEM firmware v3.0 (bukan v1.0)
```

**Problem: Pembacaan tidak stabil**

```
✅ Solutions:
- Tambahkan capasitor 100uF pada VCC PZEM
- Gunakan kabel pendek dan twisted pair
- Hindari interferensi dari relay/motor
- Set delay yang cukup antar pembacaan (min 1 detik)
```

### 2. Relay Control Issues:

**Problem: Relay tidak ON/OFF**

```
✅ Solutions:
- Cek pin GPIO18 dengan multimeter (HIGH ~3.3V, LOW ~0V)
- Pastikan relay module 3.3V compatible atau gunakan level shifter
- Cek ground connection ESP32 dan relay
- Test relay manual dengan jumper 5V ke IN
```

**Problem: Relay ON tapi load tidak nyala**

```
✅ Solutions:
- Cek wiring AC load pada terminal NO/NC relay
- Gunakan multimeter untuk cek kontak relay
- Pastikan rating relay sesuai beban (220V/10A)
- Test dengan beban kecil dulu (lampu LED)
```

### 3. Power Supply Issues:

**Problem: ESP32 restart/crash saat relay ON**

```
✅ Solutions:
- Gunakan power supply dengan ampere cukup (min 2A)
- Tambahkan capasitor 1000uF pada input 5V
- Pisahkan power relay dan ESP32 jika perlu
- Cek voltage drop saat relay switching
```

### 4. Communication Issues:

**Problem: Data tidak terkirim ke API**

```
✅ Solutions:
- Cek WiFi connection dengan ping
- Test API dengan Postman/curl dulu
- Periksa format JSON payload
- Cek firewall/port blocking
- Gunakan HTTP dulu, HTTPS nanti
```

### 5. Serial Monitor Debug:

**Enable detail debugging:**

```cpp
#define DEBUG_SERIAL 1

void debugPrint(String message) {
  #if DEBUG_SERIAL
  Serial.println("[DEBUG] " + message);
  #endif
}
```

**Useful Commands:**

```
- Open Serial Monitor: Ctrl+Shift+M
- Baud rate: 115200
- Commands: STATUS, ON, OFF, RESET, HELP
```

### 3. Network Optimization:

```cpp
// Implementasi data buffering
// Kirim multiple readings dalam satu request
```

## 🔄 OTA Updates

### Enable OTA:

```cpp
#include <ArduinoOTA.h>

ArduinoOTA.setPassword("your_password");
ArduinoOTA.begin();

// Di loop():
ArduinoOTA.handle();
```

### Update via WiFi:

1. Connect ESP32 ke WiFi yang sama dengan computer
2. Arduino IDE → Tools → Port → ESP32 at 192.168.x.x (Network Port)
3. Upload code seperti biasa

## 📋 Production Checklist

- [ ] WiFi credentials configured
- [ ] API URL correct
- [ ] Device serial unique
- [ ] PZEM wiring correct
- [ ] Temperature sensor working
- [ ] LED indicators working
- [ ] OTA enabled and password set
- [ ] Watchdog timer configured
- [ ] Error handling implemented
- [ ] Data buffering working
- [ ] Deep sleep tested (if used)
- [ ] Memory usage optimized
- [ ] Enclosure and mounting ready

## 🆘 Support

Jika mengalami masalah:

1. Check Serial Monitor output
2. Verify wiring connections
3. Test API endpoint dengan curl/Postman
4. Check device serial di database
5. Monitor WiFi signal strength

Happy monitoring! ⚡🔌
