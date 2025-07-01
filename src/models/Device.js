const { pool } = require("../database/database");

class Device {
  static async create(deviceData) {
    const { user_id, device_name, device_type, device_serial, location } =
      deviceData;

    const [result] = await pool.execute(
      `INSERT INTO devices (user_id, device_name, device_type, device_serial, location) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, device_name, device_type, device_serial, location || null]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM devices WHERE id = ?", [
      id,
    ]);

    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return rows;
  }

  static async findBySerial(deviceSerial) {
    const [rows] = await pool.execute(
      "SELECT * FROM devices WHERE device_serial = ?",
      [deviceSerial]
    );

    return rows[0] || null;
  }

  static async update(id, deviceData) {
    const { device_name, device_type, location, status } = deviceData;

    const [result] = await pool.execute(
      "UPDATE devices SET device_name = ?, device_type = ?, location = ?, status = ? WHERE id = ?",
      [device_name, device_type, location || null, status, id]
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM devices WHERE id = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  }

  static async serialExists(serial, excludeId = null) {
    let query = "SELECT COUNT(*) as count FROM devices WHERE device_serial = ?";
    let params = [serial];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].count > 0;
  }

  static async getDeviceWithLatestReading(deviceId) {
    const [rows] = await pool.execute(
      `SELECT 
        d.*,
        er.voltage,
        er.current_ampere,
        er.power_watts,
        er.energy_kwh,
        er.power_factor,
        er.frequency,
        er.temperature,
        er.recorded_at as last_reading_at
      FROM devices d
      LEFT JOIN electricity_readings er ON d.id = er.device_id
      WHERE d.id = ?
      ORDER BY er.recorded_at DESC
      LIMIT 1`,
      [deviceId]
    );

    return rows[0] || null;
  }
}

module.exports = Device;
