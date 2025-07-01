# 🏁 WattMate Setup - READY TO USE!

Semua file sudah disiapkan untuk hardware Anda: **ESP32 + PZEM-004T + Relay 1 Channel**

## 📁 Files untuk Anda

### Backend API (Node.js + MySQL)

- ✅ `src/` - Complete backend API dengan authentication, device management, monitoring
- ✅ `package.json` - Dependencies sudah lengkap
- ✅ `.env.example` - Template environment variables
- ✅ `README.md` - Setup instructions backend

### ESP32 Script (Hardware Specific)

- ✅ `esp32/wattmate_esp32_pzem_relay.ino` - **MAIN FILE untuk hardware Anda**
- ✅ `esp32/README.md` - Wiring diagram, troubleshooting, safety warnings
- ✅ `WIRING_CHECKLIST.md` - Step-by-step wiring guide

### Documentation

- ✅ `MONITORING_API.md` - API endpoints untuk monitoring data
- ✅ `.github/workflows/deploy.yml` - Auto-deployment ke server

## 🚀 Next Steps

### 1. Setup Backend (5 menit)

```bash
cd monitoring-listrik-be
npm install
cp .env.example .env
# Edit .env (database credentials)
npm run migrate
npm start
```

### 2. Setup ESP32 (10 menit)

```bash
# Arduino IDE:
1. Open: esp32/wattmate_esp32_pzem_relay.ino
2. Install libraries: ArduinoJson, PZEM-004T-v30
3. Edit WiFi credentials & API URL
4. Upload to ESP32
```

### 3. Hardware Wiring (15 menit)

```bash
# Follow: WIRING_CHECKLIST.md
# Safety: Use 5V for PZEM & Relay, test with 12V first!
ESP32 5V → PZEM VCC, Relay VCC
ESP32 GPIO16 → PZEM RX
ESP32 GPIO17 → PZEM TX
ESP32 GPIO18 → Relay IN
```

### 4. Test & Verify (5 menit)

```bash
# Serial Monitor (115200 baud):
STATUS - Check device status
ON     - Turn relay ON
OFF    - Turn relay OFF

# API Test:
GET http://localhost:3001/api/devices
GET http://localhost:3001/api/monitoring/data/WATT001
```

## 🎯 What You Get

### Hardware Features

- ⚡ Real-time electricity monitoring (Voltage, Current, Power, Energy, Power Factor, Frequency)
- 🔌 Remote relay ON/OFF control via API atau Serial commands
- 🛡️ Safety protection (auto shutdown on overvoltage/overcurrent)
- 📱 WiFi connectivity untuk remote monitoring

### Software Features

- 🔐 User authentication (register, login, JWT tokens)
- 📊 Device management (add device, status monitoring)
- 💾 Data storage (MySQL database dengan timestamped readings)
- 📈 API endpoints untuk monitoring data (real-time + historical)
- 🚀 Production-ready deployment dengan PM2

### API Endpoints Ready:

```
POST /api/auth/register        - User registration
POST /api/auth/login          - User login
GET  /api/devices             - List user devices
POST /api/devices             - Add new device
GET  /api/monitoring/data/:serial - Get device readings
POST /api/monitoring/data/:serial - Add new reading (ESP32 → API)
```

## 🔧 Customization Options

### ESP32 Script Settings:

```cpp
// Intervals
const unsigned long SENSOR_INTERVAL = 5000;   // Read every 5 seconds
const unsigned long API_INTERVAL = 30000;     // Send every 30 seconds

// Safety limits
const float MAX_VOLTAGE = 250.0;   // Auto OFF if > 250V
const float MAX_CURRENT = 20.0;    // Auto OFF if > 20A
const float MAX_POWER = 4000.0;    // Auto OFF if > 4000W
```

### API Configuration:

```javascript
// src/controllers/MonitoringController.js
// Customize data validation, alerts, calculations
```

## 📞 Support

### Documentation:

- `esp32/README.md` - Detailed ESP32 setup, wiring, troubleshooting
- `MONITORING_API.md` - Complete API documentation
- `WIRING_CHECKLIST.md` - Step-by-step hardware setup

### Common Issues:

1. **PZEM not detected** → Check 5V power, RX/TX pins
2. **Relay not working** → Verify GPIO18 signal, 5V power
3. **WiFi connection failed** → Check SSID/password, signal strength
4. **API not receiving data** → Verify server IP, firewall, JSON format

### Commands for Testing:

```bash
# Backend
npm test                    # Run tests
npm run dev                 # Development mode with auto-reload
pm2 start ecosystem.config.js  # Production deployment

# ESP32
# Serial Monitor commands: STATUS, ON, OFF, RESET, HELP
```

---

**Ready to use!** Start dengan backend setup, then ESP32 upload, then hardware wiring. Follow WIRING_CHECKLIST.md untuk step-by-step guide.

**⚠️ Safety First:** Test dengan 12V LED sebelum menggunakan 220V AC load!
