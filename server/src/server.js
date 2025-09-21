const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const dailyMenuRoutes = require("./routes/dailyMenuRoutes");
const weeklyMenuRoutes = require("./routes/weeklyMenuRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/daily-menu", dailyMenuRoutes);
app.use("/api/weekly-menu", weeklyMenuRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    message: "Mess Management API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
