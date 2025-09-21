const express = require("express");
const {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById,
} = require("../controllers/menuController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllMenuItems);
router.get("/:id", getMenuItemById);

// Admin-only routes
router.post("/", authMiddleware, adminMiddleware, createMenuItem);
router.put("/:id", authMiddleware, adminMiddleware, updateMenuItem);
router.delete("/:id", authMiddleware, adminMiddleware, deleteMenuItem);

module.exports = router;
