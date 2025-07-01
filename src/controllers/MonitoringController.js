const Device = require("../models/Device");
const ElectricityReading = require("../models/ElectricityReading");

class MonitoringController {
  // CREATE - Add device
  static async addDevice(req, res) {
    try {
      const userId = req.user.id;
      const { device_name, device_type, device_serial, location } = req.body;

      // Check if device serial already exists
      const existingDevice = await Device.findBySerial(device_serial);
      if (existingDevice) {
        return res.status(400).json({
          success: false,
          message: "Serial device sudah terdaftar",
        });
      }

      // Create device
      const deviceId = await Device.create({
        user_id: userId,
        device_name,
        device_type,
        device_serial,
        location,
      });

      // Get created device
      const device = await Device.findById(deviceId);

      res.status(201).json({
        success: true,
        message: "Device berhasil ditambahkan",
        data: { device },
      });
    } catch (error) {
      console.error("Add device error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // READ - Get user devices
  static async getDevices(req, res) {
    try {
      const userId = req.user.id;
      const devices = await Device.findByUserId(userId);

      res.json({
        success: true,
        message: "Data devices berhasil diambil",
        data: { devices },
      });
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // READ - Get device detail with latest reading
  static async getDeviceDetail(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      // Get device with latest reading
      const device = await Device.getDeviceWithLatestReading(deviceId);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device tidak ditemukan",
        });
      }

      // Check if device belongs to user
      if (device.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak",
        });
      }

      res.json({
        success: true,
        message: "Detail device berhasil diambil",
        data: { device },
      });
    } catch (error) {
      console.error("Get device detail error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // CREATE - Post monitoring data (MAIN ENDPOINT for IoT devices)
  static async postMonitoringData(req, res) {
    try {
      const { device_serial } = req.params;
      const {
        voltage,
        current_ampere,
        power_watts,
        energy_kwh,
        power_factor,
        frequency,
        temperature,
      } = req.body;

      // Find device by serial
      const device = await Device.findBySerial(device_serial);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device dengan serial tersebut tidak ditemukan",
        });
      }

      // Check if device is active
      if (device.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Device sedang tidak aktif",
        });
      }

      // Create electricity reading
      const readingId = await ElectricityReading.create({
        device_id: device.id,
        voltage,
        current_ampere,
        power_watts,
        energy_kwh,
        power_factor,
        frequency,
        temperature,
      });

      // Get created reading
      const reading = await ElectricityReading.findById(readingId);

      res.status(201).json({
        success: true,
        message: "Data monitoring berhasil disimpan",
        data: {
          reading,
          device: {
            id: device.id,
            name: device.device_name,
            serial: device.device_serial,
          },
        },
      });
    } catch (error) {
      console.error("Post monitoring data error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // CREATE - Bulk post monitoring data
  static async bulkPostMonitoringData(req, res) {
    try {
      const { device_serial } = req.params;
      const { readings } = req.body;

      if (!Array.isArray(readings) || readings.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Data readings harus berupa array dan tidak boleh kosong",
        });
      }

      // Find device by serial
      const device = await Device.findBySerial(device_serial);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device dengan serial tersebut tidak ditemukan",
        });
      }

      // Add device_id to each reading
      const readingsWithDeviceId = readings.map((reading) => ({
        ...reading,
        device_id: device.id,
      }));

      // Bulk insert
      const insertedCount = await ElectricityReading.bulkCreate(
        readingsWithDeviceId
      );

      res.status(201).json({
        success: true,
        message: `${insertedCount} data monitoring berhasil disimpan`,
        data: {
          inserted_count: insertedCount,
          device: {
            id: device.id,
            name: device.device_name,
            serial: device.device_serial,
          },
        },
      });
    } catch (error) {
      console.error("Bulk post monitoring data error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // READ - Get device readings
  static async getDeviceReadings(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { limit = 100, offset = 0, start_date, end_date } = req.query;

      // Check if device belongs to user
      const device = await Device.findById(deviceId);
      if (!device || device.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Device tidak ditemukan",
        });
      }

      let readings;

      if (start_date && end_date) {
        readings = await ElectricityReading.getReadingsByDateRange(
          deviceId,
          start_date,
          end_date,
          parseInt(limit)
        );
      } else {
        readings = await ElectricityReading.findByDeviceId(
          deviceId,
          parseInt(limit),
          parseInt(offset)
        );
      }

      res.json({
        success: true,
        message: "Data readings berhasil diambil",
        data: {
          readings,
          device: {
            id: device.id,
            name: device.device_name,
            serial: device.device_serial,
          },
        },
      });
    } catch (error) {
      console.error("Get device readings error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // READ - Get device statistics
  static async getDeviceStatistics(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { start_date, end_date, type = "daily" } = req.query;

      // Check if device belongs to user
      const device = await Device.findById(deviceId);
      if (!device || device.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Device tidak ditemukan",
        });
      }

      let statistics;

      if (type === "hourly" && start_date) {
        statistics = await ElectricityReading.getHourlyAverages(
          deviceId,
          start_date
        );
      } else if (type === "daily" && start_date && end_date) {
        statistics = await ElectricityReading.getDailyAverages(
          deviceId,
          start_date,
          end_date
        );
      } else {
        // Default: get average of last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const now = new Date();

        statistics = await ElectricityReading.getAverageReadings(
          deviceId,
          yesterday.toISOString(),
          now.toISOString()
        );
      }

      res.json({
        success: true,
        message: "Statistik device berhasil diambil",
        data: {
          statistics,
          type,
          device: {
            id: device.id,
            name: device.device_name,
            serial: device.device_serial,
          },
        },
      });
    } catch (error) {
      console.error("Get device statistics error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // READ - Get energy consumption
  static async getEnergyConsumption(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { start_date, end_date } = req.query;

      // Check if device belongs to user
      const device = await Device.findById(deviceId);
      if (!device || device.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Device tidak ditemukan",
        });
      }

      // Default to last 30 days if no dates provided
      const endDate = end_date ? new Date(end_date) : new Date();
      const startDate = start_date ? new Date(start_date) : new Date();
      if (!start_date) {
        startDate.setDate(startDate.getDate() - 30);
      }

      const consumption = await ElectricityReading.getTotalEnergyConsumption(
        deviceId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      res.json({
        success: true,
        message: "Data konsumsi energi berhasil diambil",
        data: {
          consumption,
          period: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          },
          device: {
            id: device.id,
            name: device.device_name,
            serial: device.device_serial,
          },
        },
      });
    } catch (error) {
      console.error("Get energy consumption error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // UPDATE - Update device
  static async updateDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;
      const { device_name, device_type, location, status } = req.body;

      // Check if device belongs to user
      const device = await Device.findById(deviceId);
      if (!device || device.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Device tidak ditemukan",
        });
      }

      // Update device
      const success = await Device.update(deviceId, {
        device_name,
        device_type,
        location,
        status,
      });

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Gagal memperbarui device",
        });
      }

      // Get updated device
      const updatedDevice = await Device.findById(deviceId);

      res.json({
        success: true,
        message: "Device berhasil diperbarui",
        data: { device: updatedDevice },
      });
    } catch (error) {
      console.error("Update device error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // DELETE - Delete device
  static async deleteDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const userId = req.user.id;

      // Check if device belongs to user
      const device = await Device.findById(deviceId);
      if (!device || device.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Device tidak ditemukan",
        });
      }

      // Delete device (readings will be deleted automatically due to CASCADE)
      const success = await Device.delete(deviceId);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Gagal menghapus device",
        });
      }

      res.json({
        success: true,
        message: "Device berhasil dihapus",
      });
    } catch (error) {
      console.error("Delete device error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}

module.exports = MonitoringController;
