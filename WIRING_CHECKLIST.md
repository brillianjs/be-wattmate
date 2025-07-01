# 🔌 Wiring Checklist - ESP32 + PZEM + Relay

**Hardware:** ESP32 Development Board + PZEM-004T + Relay 1 Channel

## ✅ Pre-Wiring Checklist

- [ ] ESP32 board berfungsi (upload blink test)
- [ ] PZEM-004T tested (dengan module lain atau manual)
- [ ] Relay module tested (dengan jumper manual)
- [ ] Power supply 5V/2A available
- [ ] Multimeter ready untuk testing
- [ ] Enclosure/case untuk safety (recommended)

## 🔌 Step-by-Step Wiring

### Step 1: Power Connections (IMPORTANT!)

```
✅ ESP32 Board Power:
- Hubungkan USB 5V atau external 5V/2A adapter
- Jangan gunakan 3.3V untuk PZEM dan Relay!

✅ Common Ground:
ESP32 GND → PZEM GND → Relay GND (semua terhubung)
```

### Step 2: PZEM-004T Connections

```
✅ PZEM Power:
ESP32 5V → PZEM VCC

✅ PZEM Communication:
ESP32 GPIO16 (RX) → PZEM TX
ESP32 GPIO17 (TX) → PZEM RX
```

### Step 3: Relay Module Connections

```
✅ Relay Power:
ESP32 5V → Relay VCC

✅ Relay Control:
ESP32 GPIO18 → Relay IN (signal)
```

### Step 4: Optional Connections

```
✅ Status LED:
ESP32 GPIO2 (built-in LED sudah cukup)

✅ Manual Button (optional):
ESP32 GPIO0 → Button → GND (dengan pull-up internal)
```

## 🧪 Testing Steps

### Test 1: Power & Basic Function

- [ ] ESP32 boot up (Serial Monitor 115200 baud)
- [ ] WiFi connected (check IP address)
- [ ] Built-in LED blink pattern normal

### Test 2: PZEM Communication

- [ ] "PZEM detected" message di Serial Monitor
- [ ] Voltage reading muncul (220V ± 10V)
- [ ] Current/Power readings wajar (sesuai beban)

### Test 3: Relay Control

- [ ] Command `ON` → Relay click sound + LED ON
- [ ] Command `OFF` → Relay click sound + LED OFF
- [ ] Test dengan beban kecil (lampu LED 12V dulu)

### Test 4: API Communication

- [ ] Data terkirim ke server (HTTP 200/201 response)
- [ ] Data muncul di endpoint `/api/monitoring/data/:device_serial`
- [ ] Timestamp dan device_serial sesuai

### Test 5: Safety Check

- [ ] Overvoltage protection works (>250V → relay OFF)
- [ ] Overcurrent protection works (>20A → relay OFF)
- [ ] Manual emergency stop works (command `OFF`)

## ⚠️ SAFETY WARNINGS

```
🚨 LISTRIK 220V BERBAHAYA! 🚨

1. SELALU matikan MCB sebelum wiring AC load
2. Test dengan 12V LED dulu sebelum 220V
3. Gunakan enclosure untuk semua terminal
4. Double-check wiring dengan multimeter
5. Jangan sentuh terminal saat ada power
6. Gunakan MCB/fuse untuk proteksi
7. Jika ragu - minta bantuan teknisi listrik!
```

## 🔧 Common Issues & Quick Fixes

### PZEM tidak terbaca

- Cek RX/TX pin (mungkin terbalik)
- Pastikan 5V (bukan 3.3V) ke PZEM
- Cek ground connection
- Test dengan delay lebih lama (2-3 detik)

### Relay tidak respon

- Cek GPIO18 voltage (3.3V HIGH, 0V LOW)
- Pastikan relay compatible dengan 3.3V signal
- Cek power 5V ke relay module
- Test manual dengan jumper

### WiFi tidak connect

- Cek SSID/password di code
- Test dengan hotspot HP dulu
- Cek range WiFi dari ESP32
- Reset ESP32 dan coba lagi

### API tidak terima data

- Ping server dari PC (pastikan reachable)
- Test API dengan Postman/curl
- Cek firewall/port blocking
- Verify JSON format di Serial Monitor

## 📞 Need Help?

1. Check Serial Monitor untuk error messages
2. Test individual components (ESP32, PZEM, Relay)
3. Use multimeter untuk verify voltage levels
4. Check `esp32/README.md` untuk detailed troubleshooting
5. Jika masih stuck - dokumentasikan error dan ask for help!

---

**File:** `wattmate_esp32_pzem_relay.ino`  
**Documentation:** `esp32/README.md`  
**API Docs:** `MONITORING_API.md`
