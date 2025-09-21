const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Menu item name must be at least 2 characters long"],
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
menuItemSchema.index({ isAvailable: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
