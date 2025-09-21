const express = require("express");
const router = express.Router();
const {
  getDailyMenu,
  getAllDailyMenus,
  createDailyMenu,
  updateDailyMenu,
  deleteDailyMenu,
  cloneDailyMenu,
} = require("../controllers/dailyMenuController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

// Public routes (for users to view menus)
router.get("/:date", getDailyMenu); // Get menu for specific date or "today"

// Protected routes - require authentication
router.use(authMiddleware);

router.get("/", getAllDailyMenus); // Get all daily menus with pagination

// Admin only routes
router.use(adminMiddleware);

router.post("/", createDailyMenu); // Create new daily menu
router.post("/clone", cloneDailyMenu); // Clone menu from another date
router.put("/:id", updateDailyMenu); // Update daily menu
router.delete("/:id", deleteDailyMenu); // Delete daily menu (soft delete)

module.exports = router;
