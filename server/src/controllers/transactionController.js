const { Transaction, User } = require("../models");

const createTransaction = async (req, res) => {
  try {
    const { userId, items } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Items array is required and must not be empty",
      });
    }

    // Use authenticated user's ID if not provided and user is not admin
    const targetUserId =
      req.user.role === "admin" && userId ? userId : req.user._id;

    // Validate that user exists
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum + item.price * quantity;
    }, 0);

    const transaction = new Transaction({
      userId: targetUserId,
      items: items.map((item) => ({
        name: item.name.trim(),
        price: parseFloat(item.price),
        quantity: item.quantity || 1,
      })),
      total: parseFloat(total.toFixed(2)),
    });

    await transaction.save();

    // Populate user info for response
    await transaction.populate("userId", "name email");

    res.status(201).json({
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      message: "Error creating transaction",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const getUserTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    // Check if user can access these transactions
    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json({
        message: "Access denied. You can only view your own transactions.",
      });
    }

    // Build filter
    const filter = { userId: id };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    res.json({
      message: "Transactions fetched successfully",
      data: transactions,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get user transactions error:", error);
    res.status(500).json({
      message: "Error fetching transactions",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, userId } = req.query;

    // Build filter
    const filter = {};
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    res.json({
      message: "All transactions fetched successfully",
      data: transactions,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      message: "Error fetching transactions",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate(
      "userId",
      "name email"
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // Check if user can access this transaction
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== transaction.userId._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied. You can only view your own transactions.",
      });
    }

    res.json({
      message: "Transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      message: "Error fetching transaction",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

module.exports = {
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  getTransactionById,
};
