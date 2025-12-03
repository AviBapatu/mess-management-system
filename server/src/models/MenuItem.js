const mongoose = require("mongoose");
const { normalizeName } = require("../utils/text");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Menu item name must be at least 2 characters long"],
    },
    // Stored lowercase/normalized form to make matching robust
    nameNormalized: {
      type: String,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: "Price must be a valid positive number",
      },
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    // Optional list of alternate names (synonyms) that ML may output
    aliases: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
menuItemSchema.index({ name: 1 });
menuItemSchema.index({ nameNormalized: 1 }, { unique: true, partialFilterExpression: { nameNormalized: { $type: "string" } } });
menuItemSchema.index({ isAvailable: 1 });

// Normalize name before save
menuItemSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = this.name.trim();
    this.nameNormalized = normalizeName(this.name);
  }
  // Clean aliases
  if (this.isModified("aliases") && Array.isArray(this.aliases)) {
    this.aliases = this.aliases
      .map((a) => (typeof a === "string" ? a.trim() : ""))
      .filter(Boolean);
  }
  next();
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
