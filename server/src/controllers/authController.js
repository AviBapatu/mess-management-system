const jwt = require("jsonwebtoken");
const { User } = require("../models");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
};

const axios = require("axios");
const FormData = require("form-data");

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Helper to call ML service
async function getFaceEmbedding(fileBuffer, filename, mimetype) {
  const form = new FormData();
  form.append("face_image", fileBuffer, {
    filename: filename,
    contentType: mimetype,
  });

  const url = `${ML_BASE_URL}/face/embedding`;
  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 60000,
  });
  return res.data;
}

const signup = async (req, res) => {
  try {
    console.log("Signup Request Content-Type:", req.headers["content-type"]);
    console.log("Signup Request Body keys:", Object.keys(req.body));
    console.log("Signup Request File:", req.file ? "Present" : "Missing");

    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    // Validate face image
    if (!req.file) {
      return res.status(400).json({
        message: "Face image is required for registration",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // Get face embedding from ML service
    let faceEmbedding = null;
    try {
      console.log("Requesting face embedding for file:", req.file.originalname);
      const mlData = await getFaceEmbedding(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      console.log("ML Service response keys:", Object.keys(mlData || {}));

      if (mlData && Array.isArray(mlData.embedding)) {
        faceEmbedding = mlData.embedding;
        console.log("Face embedding received, length:", faceEmbedding.length);
        if (faceEmbedding.length > 0) {
          console.log("First 5 values:", faceEmbedding.slice(0, 5));
        }
      } else {
        console.error("Invalid embedding response structure:", mlData);
        throw new Error("Invalid embedding response");
      }
    } catch (mlError) {
      console.error("ML Service Error:", mlError.message);
      if (mlError.response) {
        console.error("ML Service Response Data:", mlError.response.data);
      }
      return res.status(502).json({
        message: "Failed to process face image. Please try again.",
        error: mlError.message,
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "user",
      faceEmbedding: faceEmbedding,
    });

    console.log("User instance created. faceEmbedding present:", !!user.faceEmbedding);
    console.log("User instance faceEmbedding length:", user.faceEmbedding?.length);
    console.log("User instance faceEmbedding type:", typeof user.faceEmbedding);

    await user.save();
    console.log("User saved successfully.");

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasFaceEmbedding: !!(user.faceEmbedding && user.faceEmbedding.length > 0),
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      message: "Error creating user",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasFaceEmbedding: !!(user.faceEmbedding && user.faceEmbedding.length > 0),
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Error during login",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        hasFaceEmbedding: !!(req.user.faceEmbedding && req.user.faceEmbedding.length > 0),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Error fetching profile",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
};
