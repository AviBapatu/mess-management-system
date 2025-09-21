const express = require("express");
const {
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  getTransactionById,
} = require("../controllers/transactionController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes - require authentication
router.post("/", authMiddleware, createTransaction);
router.get("/user/:id/history", authMiddleware, getUserTransactions);
router.get("/:id", authMiddleware, getTransactionById);

// Admin-only routes
router.get("/", authMiddleware, adminMiddleware, getAllTransactions);

module.exports = router;
