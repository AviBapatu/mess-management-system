const express = require("express");
const {
  getAnalytics,
  getRevenueAnalytics,
} = require("../controllers/analyticsController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Admin-only routes
router.get("/", authMiddleware, adminMiddleware, getAnalytics);
router.get("/revenue", authMiddleware, adminMiddleware, getRevenueAnalytics);

module.exports = router;
