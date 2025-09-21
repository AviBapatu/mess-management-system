const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid token. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired.",
      });
    }
    res.status(500).json({
      message: "Token verification failed.",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
