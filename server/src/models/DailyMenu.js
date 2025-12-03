const mongoose = require("mongoose");

const dailyMenuSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      unique: true, // Only one menu per day
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
dailyMenuSchema.index({ isActive: 1 });
dailyMenuSchema.index({ date: 1, isActive: 1 });

// Virtual for formatted date
dailyMenuSchema.virtual("formattedDate").get(function () {
  return this.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
});

// Static method to get today's menu
dailyMenuSchema.statics.getTodaysMenu = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.findOne({ date: today, isActive: true })
    .populate("meals.breakfast.items.menuItemId")
    .populate("meals.lunch.items.menuItemId")
    .populate("meals.dinner.items.menuItemId")
    .populate("createdBy", "name email");
};

// Static method to get menu for a specific date
dailyMenuSchema.statics.getMenuForDate = async function (date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return this.findOne({ date: targetDate, isActive: true })
    .populate("meals.breakfast.items.menuItemId")
    .populate("meals.lunch.items.menuItemId")
    .populate("meals.dinner.items.menuItemId")
    .populate("createdBy", "name email");
};

// Method to get available items for a specific meal
dailyMenuSchema.methods.getAvailableItems = function (mealType) {
  if (!this.meals[mealType] || !this.meals[mealType].isActive) {
    return [];
  }

  return this.meals[mealType].items.filter((item) => item.isAvailable);
};

// Ensure virtual fields are included in JSON output
dailyMenuSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("DailyMenu", dailyMenuSchema);
