const axios = require("axios");
const FormData = require("form-data");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { User, MenuItem, Transaction } = require("../models");
const { normalizeName } = require("../utils/text");

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper to call ML service with multipart (for face only now)
async function mlPostMultipart(path, fields, files) {
  const form = new FormData();
  Object.entries(fields || {}).forEach(([k, v]) => form.append(k, v));
  for (const f of files || []) {
    form.append(f.field, f.buffer, {
      filename: f.filename,
      contentType: f.mimetype,
    });
  }
  const url = `${ML_BASE_URL}${path}`;
  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 120000,
  });
  return res.data;
}

function cosineDistance(a = [], b = []) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 1.0;
  let dot = 0.0,
    na = 0.0,
    nb = 0.0;
  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]) || 0;
    const y = Number(b[i]) || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) + 1e-8;
  if (denom === 0) return 1.0;
  return 1.0 - dot / denom;
}

// POST /api/ml/register-face (stateless)
// Requires auth, expects req.file("face_image")
async function registerFace(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "face_image is required" });
    }
    const user = req.user;
    // Ask ML for the embedding only
    const data = await mlPostMultipart("/face/embedding", {}, [
      {
        field: "face_image",
        buffer: req.file.buffer,
        filename: req.file.originalname || "face.jpg",
        mimetype: req.file.mimetype || "image/jpeg",
      },
    ]);

    if (!data || !Array.isArray(data.embedding)) {
      return res
        .status(502)
        .json({ message: "ML service did not return embedding" });
    }

    // Persist embedding in Mongo
    user.faceEmbedding = data.embedding;
    await user.save();

    return res.json({
      message: "Face registered successfully",
      embeddingLength: data.embedding.length,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("registerFace error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({
        message: "Failed to register face",
        error: err.response?.data || err.message,
      });
  }
}

// POST /api/ml/scan (stateless)
// Requires auth, expects req.files: food_image, face_image
async function scanFood(req, res) {
  try {
    const foodFile = req.files?.food_image?.[0];
    const faceFile = req.files?.face_image?.[0];
    if (!foodFile || !faceFile) {
      return res
        .status(400)
        .json({ message: "food_image and face_image are required" });
    }

    // 1. Face Recognition (Local Python Service)
    let faceEmbedding = null;
    try {
      const faceData = await mlPostMultipart("/face/embedding", {}, [
        {
          field: "face_image",
          buffer: faceFile.buffer,
          filename: faceFile.originalname || "face.jpg",
          mimetype: faceFile.mimetype || "image/jpeg",
        },
      ]);
      if (faceData && Array.isArray(faceData.embedding)) {
        faceEmbedding = faceData.embedding;
      }
    } catch (faceErr) {
      console.error("Face service error:", faceErr.message);
      // We might want to continue even if face fails, or fail hard.
      // For now, let's fail hard as user identification is crucial.
      return res.status(502).json({ message: "Face recognition service failed" });
    }

    // Match embedding against users
    let targetUser = null;
    let bestDist = null;
    if (faceEmbedding) {
      const candidates = await User.find({
        faceEmbedding: { $exists: true, $ne: null },
      });
      for (const u of candidates) {
        if (!Array.isArray(u.faceEmbedding) || u.faceEmbedding.length === 0)
          continue;
        const d = cosineDistance(faceEmbedding, u.faceEmbedding);
        if (bestDist === null || d < bestDist) {
          bestDist = d;
          targetUser = u;
        }
      }
      // Threshold for acceptance (tunable)
      const threshold = 0.3;
      if (bestDist === null || bestDist > threshold) {
        targetUser = null;
      }
    }
    if (!targetUser) targetUser = req.user; // fallback to logged-in user if match fails or not found

    // 2. Food Detection (Gemini LLM)
    let detected = [];
    try {
      if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Identify the food items in this image. Return a JSON array of objects, where each object has a "class_name" property (string) for the food name. Example: [{"class_name": "pizza"}, {"class_name": "burger"}]. Do not include any markdown formatting or explanation, just the raw JSON.`;

      const imagePart = {
        inlineData: {
          data: foodFile.buffer.toString("base64"),
          mimeType: foodFile.mimetype,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Clean up potential markdown code blocks if Gemini sends them
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      detected = JSON.parse(jsonStr);

      if (!Array.isArray(detected)) {
        console.warn("Gemini returned non-array:", detected);
        detected = [];
      }
    } catch (geminiErr) {
      console.error("Gemini error:", geminiErr);
      return res.status(502).json({ message: "Food detection failed", error: geminiErr.message });
    }

    // Map detected items to MenuItems using normalized names and aliases
    const labelCounts = new Map();
    for (const d of detected) {
      const raw = (d.class_name || "").trim();
      if (!raw) continue;
      const norm = normalizeName(raw);
      labelCounts.set(norm, (labelCounts.get(norm) || 0) + 1);
    }

    const allMenu = await MenuItem.find({ isAvailable: true });
    const byName = new Map(); // normalized name -> item
    const byAlias = new Map(); // normalized alias -> item
    for (const mi of allMenu) {
      const n = normalizeName(mi.name);
      if (!byName.has(n)) byName.set(n, mi);
      if (Array.isArray(mi.aliases)) {
        for (const a of mi.aliases) {
          const an = normalizeName(a);
          if (an && !byAlias.has(an)) byAlias.set(an, mi);
        }
      }
    }

    const items = [];
    for (const [norm, qty] of labelCounts.entries()) {
      const mi = byName.get(norm) || byAlias.get(norm);
      if (mi) {
        items.push({ name: mi.name, price: mi.price, quantity: qty });
      }
    }

    // If none matched, still return detection results
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const trx = await Transaction.create({
      userId: targetUser._id,
      items,
      total,
      status: "completed",
      metadata: {
        faceDistance: bestDist,
        rawFoodItems: detected,
      },
    });

    return res.json({
      message: "Scan processed",
      recognizedUser: {
        id: targetUser.id,
        name: targetUser.name,
        mlUserId: targetUser.mlUserId ?? null,
      },
      detected: detected,
      matchedItems: items,
      total,
      transaction: trx,
    });
  } catch (err) {
    console.error("scanFood error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({
        message: "Failed to process scan",
        error: err.response?.data || err.message,
      });
  }
}

module.exports = { registerFace, scanFood };

