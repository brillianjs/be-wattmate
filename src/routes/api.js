const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "WattMate API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API info endpoint
router.get("/info", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "WattMate Backend API",
      description: "Smart Electricity Monitoring System",
      version: "1.0.0",
      endpoints: {
        auth: "/api/auth",
        devices: "/api/devices",
        readings: "/api/readings",
      },
    },
  });
});

module.exports = router;
