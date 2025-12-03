const axios = require("axios");
const FormData = require("form-data");
const { User, MenuItem, Transaction } = require("../models");
const { normalizeName } = require("../utils/text");

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Helper to call ML service with multipart
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
    timeout: 60000,
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

    // Call ML service to get both detection and face embedding
    const data = await mlPostMultipart("/analyze", {}, [
      {
        field: "food_image",
        buffer: foodFile.buffer,
        filename: foodFile.originalname || "food.jpg",
        mimetype: foodFile.mimetype || "image/jpeg",
      },
      {
        field: "face_image",
        buffer: faceFile.buffer,
        filename: faceFile.originalname || "face.jpg",
        mimetype: faceFile.mimetype || "image/jpeg",
      },
    ]);

    // Debug: log ML service response summary/raw
    if (process.env.DEBUG_ML_RESPONSE === "1") {
      try {
        const fi = Array.isArray(data.food_items) ? data.food_items : [];
        const embLen = Array.isArray(data.embedding) ? data.embedding.length : null;
        console.log(
          `[ML Response] food_items=${fi.length}, embedding_len=${embLen}`
        );
        const preview = fi.slice(0, 20).map((d, i) => ({
          i,
          class: d.class_name ?? d.class ?? null,
          conf: d.confidence ?? d.conf ?? null,
          box: d.box ?? d.bbox ?? undefined,
        }));
        console.log("[ML Response] items_preview:", preview);
        if (process.env.DEBUG_ML_RAW === "1") {
          const embHead = Array.isArray(data.embedding)
            ? data.embedding.slice(0, 8)
            : null;
          const safe = {
            ...data,
            embedding: embHead,
          };
          console.log("[ML Response raw]", JSON.stringify(safe, null, 2));
        }
      } catch (e) {
        console.warn("[ML Response] failed to log response:", e.message);
      }
    }

    const detected = Array.isArray(data.food_items) ? data.food_items : [];
    const faceEmbedding = Array.isArray(data.embedding) ? data.embedding : null;

    // Match embedding against users with stored embeddings
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
    if (!targetUser) targetUser = req.user; // fallback

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

    // Optional debug logging per detected item
    if (process.env.DEBUG_ML_MATCH === "1") {
      console.log(
        `[ML Match] Available menu keys -> names: ${byName.size}, aliases: ${byAlias.size}`
      );
      for (const d of detected) {
        const raw = (d.class_name || "").trim();
        if (!raw) continue;
        const norm = normalizeName(raw);
        const matchedByName = byName.get(norm);
        const matchedByAlias = byAlias.get(norm);
        const mi = matchedByName || matchedByAlias || null;
        const source = matchedByName ? "name" : matchedByAlias ? "alias" : "none";
        if (mi) {
          console.log(
            `[ML Match] raw="${raw}" norm="${norm}" -> MATCH via ${source}: ${mi.name} (price=${mi.price})`
          );
        } else {
          console.log(
            `[ML Match] raw="${raw}" norm="${norm}" -> NO MATCH`
          );
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
