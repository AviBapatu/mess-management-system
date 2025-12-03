const express = require("express");
const { signup, login, getProfile } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const multer = require("multer");
const path = require("path");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only images are allowed"));
    },
});

// Public routes
router.post("/signup", upload.single("face_image"), signup);
router.post("/login", login);

// Protected routes
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
