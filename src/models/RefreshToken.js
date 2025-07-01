const { pool } = require("../database/database");

class RefreshToken {
  static async create(userId, token, expiresAt) {
    const [result] = await pool.execute(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, token, expiresAt]
    );

    return result.insertId;
  }

  static async findByToken(token) {
    const [rows] = await pool.execute(
      `SELECT rt.*, u.id as user_id, u.name, u.email 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.expires_at > NOW()`,
      [token]
    );

    return rows[0] || null;
  }

  static async deleteByToken(token) {
    const [result] = await pool.execute(
      "DELETE FROM refresh_tokens WHERE token = ?",
      [token]
    );

    return result.affectedRows > 0;
  }

  static async deleteByUserId(userId) {
    const [result] = await pool.execute(
      "DELETE FROM refresh_tokens WHERE user_id = ?",
      [userId]
    );

    return result.affectedRows > 0;
  }

  static async deleteExpired() {
    const [result] = await pool.execute(
      "DELETE FROM refresh_tokens WHERE expires_at <= NOW()"
    );

    return result.affectedRows;
  }
}

module.exports = RefreshToken;
