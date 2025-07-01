# 📊 WattMate Monitoring API Documentation

API endpoint lengkap untuk monitoring data listrik di aplikasi WattMate.

## 🔌 **Endpoint Utama untuk POST Data Monitoring**

### **POST Data Monitoring (untuk IoT Device)**

```http
POST /api/monitoring/data/{device_serial}
Content-Type: application/json

{
  "voltage": 220.50,
  "current_ampere": 5.250,
  "power_watts": 1153.12,
  "energy_kwh": 2.5432,
  "power_factor": 0.85,
  "frequency": 50.0,
  "temperature": 35.5
}
```

**Response:**

```json
{
  "success": true,
  "message": "Data monitoring berhasil disimpan",
  "data": {
    "reading": {
      "id": 1,
      "device_id": 1,
      "voltage": 220.5,
      "current_ampere": 5.25,
      "power_watts": 1153.12,
      "energy_kwh": 2.5432,
      "power_factor": 0.85,
      "frequency": 50.0,
      "temperature": 35.5,
      "recorded_at": "2025-01-01T12:00:00.000Z"
    },
    "device": {
      "id": 1,
      "name": "Smart Meter Rumah",
      "serial": "WATT001"
    }
  }
}
```

### **POST Bulk Data Monitoring**

```http
POST /api/monitoring/data/{device_serial}/bulk
Content-Type: application/json

{
  "readings": [
    {
      "voltage": 220.50,
      "current_ampere": 5.250,
      "power_watts": 1153.12,
      "energy_kwh": 2.5432,
      "power_factor": 0.85,
      "frequency": 50.0,
      "temperature": 35.5
    },
    {
      "voltage": 221.20,
      "current_ampere": 5.100,
      "power_watts": 1128.12,
      "energy_kwh": 2.5500,
      "power_factor": 0.87,
      "frequency": 49.8,
      "temperature": 36.0
    }
  ]
}
```

## 🔐 **Protected Endpoints (Memerlukan Authentication)**

Untuk mengakses endpoint yang dilindungi, sertakan header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **Device Management**

#### 1. Add Device

```http
POST /api/monitoring/devices
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "device_name": "Smart Meter Rumah",
  "device_type": "Smart Meter",
  "device_serial": "WATT001",
  "location": "Ruang Utama"
}
```

#### 2. Get All User Devices

```http
GET /api/monitoring/devices
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### 3. Get Device Detail

```http
GET /api/monitoring/devices/{deviceId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### 4. Update Device

```http
PUT /api/monitoring/devices/{deviceId}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "device_name": "Smart Meter Kamar",
  "device_type": "Smart Meter",
  "location": "Kamar Tidur",
  "status": "active"
}
```

#### 5. Delete Device

```http
DELETE /api/monitoring/devices/{deviceId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **Data Monitoring & Analytics**

#### 6. Get Device Readings

```http
GET /api/monitoring/devices/{deviceId}/readings?limit=100&offset=0&start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### 7. Get Device Statistics

```http
GET /api/monitoring/devices/{deviceId}/statistics?type=daily&start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**

- `type`: `hourly` | `daily` (default: daily)
- `start_date`: Format YYYY-MM-DD
- `end_date`: Format YYYY-MM-DD

#### 8. Get Energy Consumption

```http
GET /api/monitoring/devices/{deviceId}/consumption?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 📝 **Validation Rules**

### **Monitoring Data Validation:**

- `voltage`: Number, 0-9999.99, required
- `current_ampere`: Number, 0-999.999, required
- `power_watts`: Number, 0-99999999.99, required
- `energy_kwh`: Number, 0-9999999.9999, required
- `power_factor`: Number, 0-1.000, optional
- `frequency`: Number, 0-999.99, optional
- `temperature`: Number, -99.99-999.99, optional

### **Device Validation:**

- `device_name`: String, 2-255 characters, required
- `device_type`: String, 2-100 characters, required
- `device_serial`: String, 5-255 characters, required
- `location`: String, max 255 characters, optional
- `status`: Enum ('active', 'inactive', 'maintenance'), optional

## 🌐 **Example Usage untuk Flutter/IoT**

### **Dari IoT Device (Arduino/ESP32):**

```cpp
// Arduino/ESP32 code example
#include <WiFi.h>
#include <HTTPClient.h>

void sendMonitoringData() {
  HTTPClient http;
  http.begin("http://your-api-url.com/api/monitoring/data/WATT001");
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{";
  jsonData += "\"voltage\":" + String(voltage) + ",";
  jsonData += "\"current_ampere\":" + String(current) + ",";
  jsonData += "\"power_watts\":" + String(power) + ",";
  jsonData += "\"energy_kwh\":" + String(energy);
  jsonData += "}";

  int responseCode = http.POST(jsonData);
  String response = http.getString();

  http.end();
}
```

### **Dari Flutter App:**

```dart
// Flutter code example
Future<void> getDeviceReadings(String deviceId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/monitoring/devices/$deviceId/readings'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    // Handle success
  }
}
```

## 🔧 **Testing Endpoints**

### **Test POST Data Monitoring:**

```bash
curl -X POST http://localhost:3001/api/monitoring/data/WATT001 \
  -H "Content-Type: application/json" \
  -d '{
    "voltage": 220.50,
    "current_ampere": 5.250,
    "power_watts": 1153.12,
    "energy_kwh": 2.5432,
    "power_factor": 0.85,
    "frequency": 50.0,
    "temperature": 35.5
  }'
```

### **Test Get Device Readings:**

```bash
curl -X GET "http://localhost:3001/api/monitoring/devices/1/readings" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Sekarang API WattMate Anda sudah lengkap dengan endpoint untuk POST data monitoring dari IoT device! 🎉
