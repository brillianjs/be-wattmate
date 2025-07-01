const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../middleware/auth");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { name, email, password, phone, address } = req.body;

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email sudah terdaftar",
        });
      }

      // Create new user
      const userId = await User.create({
        name,
        email,
        password,
        phone,
        address,
      });

      // Generate tokens
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      // Save refresh token to database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshToken.create(userId, refreshToken, expiresAt);

      // Get user data without password
      const user = await User.findById(userId);

      res.status(201).json({
        success: true,
        message: "Registrasi berhasil",
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email atau password salah",
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Email atau password salah",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token to database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshToken.create(user.id, refreshToken, expiresAt);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Login berhasil",
        data: {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token tidak ditemukan",
        });
      }

      // Find refresh token in database
      const tokenData = await RefreshToken.findByToken(refreshToken);
      if (!tokenData) {
        return res.status(401).json({
          success: false,
          message: "Refresh token tidak valid atau sudah expired",
        });
      }

      try {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Generate new access token
        const newAccessToken = generateAccessToken(decoded.userId);

        res.json({
          success: true,
          message: "Token berhasil diperbaharui",
          data: {
            accessToken: newAccessToken,
          },
        });
      } catch (jwtError) {
        // Delete invalid token from database
        await RefreshToken.deleteByToken(refreshToken);

        return res.status(401).json({
          success: false,
          message: "Refresh token tidak valid",
        });
      }
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await RefreshToken.deleteByToken(refreshToken);
      }

      res.json({
        success: true,
        message: "Logout berhasil",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Logout from all devices
  static async logoutAll(req, res) {
    try {
      const userId = req.user.id;

      await RefreshToken.deleteByUserId(userId);

      res.json({
        success: true,
        message: "Logout dari semua perangkat berhasil",
      });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Forgot password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist
        return res.json({
          success: true,
          message: "Jika email terdaftar, link reset password akan dikirim",
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token to database
      await User.setResetToken(email, resetToken, resetExpires);

      // Send email (in production, use proper email service)
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      try {
        const transporter = createEmailTransporter();

        await transporter.sendMail({
          from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Reset Password - WattMate",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Password</h2>
              <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
              <p>Klik link berikut untuk reset password:</p>
              <a href="${resetUrl}" style="background-color: #1E3A8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
              <p>Link ini akan expired dalam 1 jam.</p>
              <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: "Jika email terdaftar, link reset password akan dikirim",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const user = await User.findByResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Token reset tidak valid atau sudah expired",
        });
      }

      // Update password
      await User.updatePassword(user.id, password);

      // Delete all refresh tokens for this user (logout from all devices)
      await RefreshToken.deleteByUserId(user.id);

      res.json({
        success: true,
        message: "Password berhasil direset. Silakan login kembali.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, phone, address } = req.body;

      const success = await User.updateProfile(userId, {
        name,
        phone,
        address,
      });

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Gagal memperbarui profil",
        });
      }

      // Get updated user data
      const updatedUser = await User.findById(userId);

      res.json({
        success: true,
        message: "Profil berhasil diperbarui",
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findByEmail(req.user.email);

      // Verify current password
      const isValidPassword = await User.verifyPassword(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Password saat ini salah",
        });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      // Delete all refresh tokens (logout from all devices)
      await RefreshToken.deleteByUserId(userId);

      res.json({
        success: true,
        message: "Password berhasil diubah. Silakan login kembali.",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}

module.exports = AuthController;
