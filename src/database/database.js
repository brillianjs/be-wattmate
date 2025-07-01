const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "wattmate_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database migration script
async function createTables() {
  try {
    const connection = await pool.getConnection();

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_verification_token (verification_token),
        INDEX idx_reset_token (reset_password_token)
      )
    `);

    // Create devices table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        device_type VARCHAR(100) NOT NULL,
        device_serial VARCHAR(255) UNIQUE NOT NULL,
        location VARCHAR(255),
        status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_device_serial (device_serial)
      )
    `);

    // Create electricity_readings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS electricity_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id INT NOT NULL,
        voltage DECIMAL(8,2) NOT NULL,
        current_ampere DECIMAL(8,3) NOT NULL,
        power_watts DECIMAL(10,2) NOT NULL,
        energy_kwh DECIMAL(10,4) NOT NULL,
        power_factor DECIMAL(4,3),
        frequency DECIMAL(5,2),
        temperature DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
        INDEX idx_device_id (device_id),
        INDEX idx_recorded_at (recorded_at)
      )
    `);

    // Create refresh_tokens table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token(255)),
        INDEX idx_expires_at (expires_at)
      )
    `);

    connection.release();
    console.log("✅ Database tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

// Create default admin user
async function createDefaultUser() {
  try {
    const connection = await pool.getConnection();

    // Check if admin user exists
    const [rows] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      ["admin@wattmate.com"]
    );

    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await connection.execute(
        `
        INSERT INTO users (name, email, password, is_verified) 
        VALUES (?, ?, ?, ?)
      `,
        ["Admin User", "admin@wattmate.com", hashedPassword, true]
      );

      console.log("✅ Default admin user created!");
      console.log("📧 Email: admin@wattmate.com");
      console.log("🔑 Password: admin123");
    } else {
      console.log("ℹ️  Default admin user already exists");
    }

    connection.release();
  } catch (error) {
    console.error("❌ Error creating default user:", error);
    throw error;
  }
}

module.exports = {
  pool,
  createTables,
  createDefaultUser,
};
