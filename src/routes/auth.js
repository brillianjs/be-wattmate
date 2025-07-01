const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { auth } = require("../middleware/auth");
const {
  validateRequest,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require("../middleware/validation");
const rateLimit = require("express-rate-limit");

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: {
    success: false,
    message: "Terlalu banyak permintaan reset password. Coba lagi dalam 1 jam.",
  },
});

// Public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register
);
router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  AuthController.login
);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

// Protected routes (require authentication)
router.use(auth); // Apply auth middleware to all routes below

router.get("/profile", AuthController.getProfile);
router.put(
  "/profile",
  validateRequest(updateProfileSchema),
  AuthController.updateProfile
);
router.post(
  "/change-password",
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);
router.post("/logout", AuthController.logout);
router.post("/logout-all", AuthController.logoutAll);

module.exports = router;
