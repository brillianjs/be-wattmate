const { pool } = require("../database/database");
const bcrypt = require("bcryptjs");

class User {
  static async create(userData) {
    const { name, email, password, phone, address } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, phone, address) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, address || null]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, phone, address, is_verified, created_at FROM users WHERE id = ?",
      [id]
    );

    return rows[0] || null;
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const [result] = await pool.execute(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [hashedPassword, id]
    );

    return result.affectedRows > 0;
  }

  static async setResetToken(email, token, expires) {
    const [result] = await pool.execute(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?",
      [token, expires, email]
    );

    return result.affectedRows > 0;
  }

  static async findByResetToken(token) {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );

    return rows[0] || null;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(id, userData) {
    const { name, phone, address } = userData;

    const [result] = await pool.execute(
      "UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?",
      [name, phone || null, address || null, id]
    );

    return result.affectedRows > 0;
  }

  static async emailExists(email, excludeId = null) {
    let query = "SELECT COUNT(*) as count FROM users WHERE email = ?";
    let params = [email];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = User;
