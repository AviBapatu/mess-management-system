const express = require("express");
const {
  getTodaysMenu,
  getMenuForDay,
  getFullWeekMenu,
  createOrUpdateWeeklyMenu,
  deleteWeeklyMenu,
  restoreWeeklyMenu,
  copyWeeklyMenu,
} = require("../controllers/weeklyMenuController");

const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (for users to view menus)
router.get("/today", getTodaysMenu); // Get today's menu
router.get("/day/:dayOfWeek", getMenuForDay); // Get menu for specific day (0-6)
router.get("/week", getFullWeekMenu); // Get full week menu

// Admin routes (require admin authentication)
router.post("/", authMiddleware, adminMiddleware, createOrUpdateWeeklyMenu); // Create or update menu for a day
router.put(
  "/day/:dayOfWeek",
  authMiddleware,
  adminMiddleware,
  createOrUpdateWeeklyMenu
); // Alternative update route
router.delete(
  "/day/:dayOfWeek",
  authMiddleware,
  adminMiddleware,
  deleteWeeklyMenu
); // Soft delete menu for a day
router.patch(
  "/restore/:dayOfWeek",
  authMiddleware,
  adminMiddleware,
  restoreWeeklyMenu
); // Restore deleted menu
router.post("/copy", authMiddleware, adminMiddleware, copyWeeklyMenu); // Copy menu from one day to another

module.exports = router;
