/*
  Seed MenuItems from Roboflow data.yaml class list.
  - Reads: ../ml models/IOT project/data.yaml
  - Upserts MenuItem documents with default price/category.

  Usage:
    MONGO_URI=<your uri> node scripts/seedMenuFromYaml.js

  Or via package.json script: npm run seed:menu-roboflow
*/

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const yaml = require("js-yaml");
require("dotenv").config();

const { MenuItem } = require("../src/models");
const { normalizeName } = require("../src/utils/text");

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not set in environment/.env");
    process.exit(1);
  }

  // data.yaml path relative to this script
  const dataYamlPath = path.resolve(
    __dirname,
    "../ml models/IOT project/data.yaml"
  );

  if (!fs.existsSync(dataYamlPath)) {
    console.error("Could not find data.yaml at:", dataYamlPath);
    process.exit(1);
  }

  // Parse YAML
  const rawYaml = fs.readFileSync(dataYamlPath, "utf8");
  const cfg = yaml.load(rawYaml);
  const names = Array.isArray(cfg?.names) ? cfg.names : [];

  if (names.length === 0) {
    console.error("No 'names' array found in data.yaml");
    process.exit(1);
  }

  console.log(`Loaded ${names.length} class names from data.yaml`);

  // Connect DB
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // Build bulk upsert ops; default price/category, can be adjusted
  const DEFAULT_PRICE = Number(process.env.DEFAULT_MENU_PRICE || 50);
  const DEFAULT_CATEGORY = process.env.DEFAULT_MENU_CATEGORY || "General";

  const ops = names.map((name) => {
    const clean = String(name || "").trim();
    const nameNorm = normalizeName(clean);
    return {
      updateOne: {
        filter: { $or: [{ nameNormalized: nameNorm }, { name: clean }] },
        update: {
          $set: {
            name: clean,
            nameNormalized: nameNorm,
            price: DEFAULT_PRICE,
            category: DEFAULT_CATEGORY,
            isAvailable: true,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await MenuItem.bulkWrite(ops, { ordered: false });
  console.log(
    `Upsert complete. matched=${result.matchedCount}, modified=${result.modifiedCount}, upserted=${result.upsertedCount}`
  );

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

main().catch((err) => {
  console.error("Seeder error:", err);
  process.exit(1);
});
