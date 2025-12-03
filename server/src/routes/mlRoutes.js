const express = require("express");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { registerFace, scanFood } = require("../controllers/mlController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Register a user's face (after signup/login)
router.post(
  "/register-face",
  authMiddleware,
  upload.single("face_image"),
  registerFace
);

// Scan food and face to create a transaction
router.post(
  "/scan",
  authMiddleware,
  upload.fields([
    { name: "food_image", maxCount: 1 },
    { name: "face_image", maxCount: 1 },
  ]),
  scanFood
);

module.exports = router;
