const express = require("express");
const router = express.Router();
const MonitoringController = require("../controllers/MonitoringController");
const { auth } = require("../middleware/auth");
const {
  validateRequest,
  deviceSchema,
  monitoringDataSchema,
  bulkMonitoringDataSchema,
} = require("../middleware/validation");

// Public endpoint untuk IoT devices mengirim data monitoring
// Endpoint utama untuk POST data monitoring dari IoT device
router.post(
  "/data/:device_serial",
  validateRequest(monitoringDataSchema),
  MonitoringController.postMonitoringData
);

// Bulk endpoint untuk mengirim banyak data sekaligus
router.post(
  "/data/:device_serial/bulk",
  validateRequest(bulkMonitoringDataSchema),
  MonitoringController.bulkPostMonitoringData
);

// Protected routes (require authentication) - untuk mobile app
router.use(auth); // Apply auth middleware untuk semua routes dibawah

// Device management endpoints
router.post(
  "/devices",
  validateRequest(deviceSchema),
  MonitoringController.addDevice
);

router.get("/devices", MonitoringController.getDevices);

router.get("/devices/:deviceId", MonitoringController.getDeviceDetail);

router.put(
  "/devices/:deviceId",
  validateRequest(deviceSchema),
  MonitoringController.updateDevice
);

router.delete("/devices/:deviceId", MonitoringController.deleteDevice);

// Data monitoring endpoints
router.get(
  "/devices/:deviceId/readings",
  MonitoringController.getDeviceReadings
);

router.get(
  "/devices/:deviceId/statistics",
  MonitoringController.getDeviceStatistics
);

router.get(
  "/devices/:deviceId/consumption",
  MonitoringController.getEnergyConsumption
);

module.exports = router;
