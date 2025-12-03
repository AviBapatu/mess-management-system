const mongoose = require("mongoose");

const weeklyMenuSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: [true, "Day of week is required"],
      min: 0, // Sunday
      max: 6, // Saturday
      unique: true, // Only one menu per day of week
    },
    dayName: {
      type: String,
      required: [true, "Day name is required"],
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    meals: {
      breakfast: {
        items: [
          {
            menuItemId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "MenuItem",
              required: true,
            },
            isAvailable: {
              type: Boolean,
              default: true,
            },
          },
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      lunch: {
        items: [
          {
            menuItemId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "MenuItem",
              required: true,
            },
            isAvailable: {
              type: Boolean,
              default: true,
            },
          },
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      dinner: {
        items: [
          {
            menuItemId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "MenuItem",
              required: true,
            },
            isAvailable: {
              type: Boolean,
              default: true,
            },
          },
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    },
    specialNotes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by admin is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
weeklyMenuSchema.index({ isActive: 1 });
weeklyMenuSchema.index({ dayOfWeek: 1, isActive: 1 });

// Static method to get today's menu
weeklyMenuSchema.statics.getTodaysMenu = async function () {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  return this.findOne({ dayOfWeek, isActive: true })
    .populate("meals.breakfast.items.menuItemId")
    .populate("meals.lunch.items.menuItemId")
    .populate("meals.dinner.items.menuItemId")
    .populate("createdBy", "name email");
};

// Static method to get menu for a specific day of week
weeklyMenuSchema.statics.getMenuForDay = async function (dayOfWeek) {
  const menu = await this.findOne({ dayOfWeek, isActive: true }).populate(
    "createdBy",
    "name email"
  );

  if (!menu) return null;

  // Manually populate menu items
  await menu.populate([
    { path: "meals.breakfast.items.menuItemId" },
    { path: "meals.lunch.items.menuItemId" },
    { path: "meals.dinner.items.menuItemId" },
  ]);

  return menu;
};

// Static method to get all weekly menus
weeklyMenuSchema.statics.getFullWeekMenu = async function () {
  const menus = await this.find({ isActive: true })
    .sort({ dayOfWeek: 1 })
    .populate("createdBy", "name email");

  // Manually populate menu items for each menu
  for (const menu of menus) {
    await menu.populate([
      { path: "meals.breakfast.items.menuItemId" },
      { path: "meals.lunch.items.menuItemId" },
      { path: "meals.dinner.items.menuItemId" },
    ]);
  }

  return menus;
};

// Method to get available items for a specific meal
weeklyMenuSchema.methods.getAvailableItems = function (mealType) {
  if (!this.meals[mealType] || !this.meals[mealType].isActive) {
    return [];
  }

  return this.meals[mealType].items.filter((item) => item.isAvailable);
};

// Helper function to get day name from day number
weeklyMenuSchema.statics.getDayName = function (dayOfWeek) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayOfWeek] || "Unknown";
};

// Pre-save middleware to set dayName based on dayOfWeek
weeklyMenuSchema.pre("save", function (next) {
  this.dayName = this.constructor.getDayName(this.dayOfWeek);
  next();
});

module.exports = mongoose.model("WeeklyMenu", weeklyMenuSchema);
