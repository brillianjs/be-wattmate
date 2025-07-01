const { pool } = require("../database/database");

class ElectricityReading {
  static async create(readingData) {
    const {
      device_id,
      voltage,
      current_ampere,
      power_watts,
      energy_kwh,
      power_factor,
      frequency,
      temperature,
    } = readingData;

    const [result] = await pool.execute(
      `INSERT INTO electricity_readings 
       (device_id, voltage, current_ampere, power_watts, energy_kwh, power_factor, frequency, temperature) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        device_id,
        voltage,
        current_ampere,
        power_watts,
        energy_kwh,
        power_factor || null,
        frequency || null,
        temperature || null,
      ]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM electricity_readings WHERE id = ?",
      [id]
    );

    return rows[0] || null;
  }

  static async findByDeviceId(deviceId, limit = 100, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT * FROM electricity_readings 
       WHERE device_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT ? OFFSET ?`,
      [deviceId, limit, offset]
    );

    return rows;
  }

  static async getLatestByDeviceId(deviceId) {
    const [rows] = await pool.execute(
      `SELECT * FROM electricity_readings 
       WHERE device_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [deviceId]
    );

    return rows[0] || null;
  }

  static async getReadingsByDateRange(
    deviceId,
    startDate,
    endDate,
    limit = 1000
  ) {
    const [rows] = await pool.execute(
      `SELECT * FROM electricity_readings 
       WHERE device_id = ? 
       AND recorded_at BETWEEN ? AND ?
       ORDER BY recorded_at DESC 
       LIMIT ?`,
      [deviceId, startDate, endDate, limit]
    );

    return rows;
  }

  static async getAverageReadings(deviceId, startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT 
        AVG(voltage) as avg_voltage,
        AVG(current_ampere) as avg_current,
        AVG(power_watts) as avg_power,
        AVG(energy_kwh) as avg_energy,
        AVG(power_factor) as avg_power_factor,
        AVG(frequency) as avg_frequency,
        AVG(temperature) as avg_temperature,
        COUNT(*) as total_readings
      FROM electricity_readings 
      WHERE device_id = ? 
      AND recorded_at BETWEEN ? AND ?`,
      [deviceId, startDate, endDate]
    );

    return rows[0] || null;
  }

  static async getHourlyAverages(deviceId, date) {
    const [rows] = await pool.execute(
      `SELECT 
        HOUR(recorded_at) as hour,
        AVG(voltage) as avg_voltage,
        AVG(current_ampere) as avg_current,
        AVG(power_watts) as avg_power,
        AVG(energy_kwh) as avg_energy,
        COUNT(*) as readings_count
      FROM electricity_readings 
      WHERE device_id = ? 
      AND DATE(recorded_at) = ?
      GROUP BY HOUR(recorded_at)
      ORDER BY hour`,
      [deviceId, date]
    );

    return rows;
  }

  static async getDailyAverages(deviceId, startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT 
        DATE(recorded_at) as date,
        AVG(voltage) as avg_voltage,
        AVG(current_ampere) as avg_current,
        AVG(power_watts) as avg_power,
        SUM(energy_kwh) as total_energy,
        COUNT(*) as readings_count
      FROM electricity_readings 
      WHERE device_id = ? 
      AND DATE(recorded_at) BETWEEN ? AND ?
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC`,
      [deviceId, startDate, endDate]
    );

    return rows;
  }

  static async getTotalEnergyConsumption(deviceId, startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT 
        SUM(energy_kwh) as total_energy_kwh,
        AVG(power_watts) as avg_power_watts,
        COUNT(*) as total_readings
      FROM electricity_readings 
      WHERE device_id = ? 
      AND recorded_at BETWEEN ? AND ?`,
      [deviceId, startDate, endDate]
    );

    return rows[0] || null;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM electricity_readings WHERE id = ?",
      [id]
    );

    return result.affectedRows > 0;
  }

  static async deleteByDeviceId(deviceId) {
    const [result] = await pool.execute(
      "DELETE FROM electricity_readings WHERE device_id = ?",
      [deviceId]
    );

    return result.affectedRows;
  }

  // Bulk insert untuk data monitoring yang banyak
  static async bulkCreate(readingsArray) {
    if (!Array.isArray(readingsArray) || readingsArray.length === 0) {
      throw new Error("Readings array is required and must not be empty");
    }

    const values = readingsArray.map((reading) => [
      reading.device_id,
      reading.voltage,
      reading.current_ampere,
      reading.power_watts,
      reading.energy_kwh,
      reading.power_factor || null,
      reading.frequency || null,
      reading.temperature || null,
    ]);

    const placeholders = readingsArray
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    const flatValues = values.flat();

    const [result] = await pool.execute(
      `INSERT INTO electricity_readings 
       (device_id, voltage, current_ampere, power_watts, energy_kwh, power_factor, frequency, temperature) 
       VALUES ${placeholders}`,
      flatValues
    );

    return result.affectedRows;
  }
}

module.exports = ElectricityReading;
