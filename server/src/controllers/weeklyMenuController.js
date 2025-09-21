const WeeklyMenu = require("../models/WeeklyMenu");
const MenuItem = require("../models/MenuItem");

// Get today's menu
const getTodaysMenu = async (req, res) => {
  try {
    const todaysMenu = await WeeklyMenu.getTodaysMenu();

    if (!todaysMenu) {
      return res.status(404).json({
        message: "No menu found for today",
        success: false,
      });
    }

    res.status(200).json({
      message: "Today's menu retrieved successfully",
      success: true,
      data: todaysMenu,
    });
  } catch (error) {
    console.error("Error getting today's menu:", error);
    res.status(500).json({
      message: "Failed to get today's menu",
      success: false,
      error: error.message,
    });
  }
};

// Get menu for specific day of week
const getMenuForDay = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const dayNum = parseInt(dayOfWeek);

    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return res.status(400).json({
        message:
          "Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)",
        success: false,
      });
    }

    const menu = await WeeklyMenu.findOne({
      dayOfWeek: dayNum,
      isActive: true,
    }).populate("createdBy", "name email");

    if (!menu) {
      return res.status(404).json({
        message: `No menu found for ${WeeklyMenu.getDayName(dayNum)}`,
        success: false,
      });
    }

    // Manually populate menu items
    const MenuItem = require("../models/MenuItem");

    // Get all menu item IDs
    const allMenuItemIds = [];
    ["breakfast", "lunch", "dinner"].forEach((mealType) => {
      if (menu.meals[mealType] && menu.meals[mealType].items) {
        menu.meals[mealType].items.forEach((item) => {
          if (item.menuItemId) {
            allMenuItemIds.push(item.menuItemId);
          }
        });
      }
    });

    // Fetch all menu items at once
    const menuItemsData = await MenuItem.find({ _id: { $in: allMenuItemIds } });
    const menuItemsMap = {};
    menuItemsData.forEach((item) => {
      menuItemsMap[item._id.toString()] = item;
    });

    // Create a plain object with populated data
    const populatedMenu = {
      _id: menu._id,
      dayOfWeek: menu.dayOfWeek,
      dayName: menu.dayName,
      isActive: menu.isActive,
      specialNotes: menu.specialNotes,
      createdBy: menu.createdBy,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
      meals: {},
    };

    // Populate the meals with actual menu item data
    ["breakfast", "lunch", "dinner"].forEach((mealType) => {
      populatedMenu.meals[mealType] = {
        isActive: menu.meals[mealType]?.isActive || false,
        items: [],
      };

      if (menu.meals[mealType] && menu.meals[mealType].items) {
        populatedMenu.meals[mealType].items = menu.meals[mealType].items.map(
          (item) => ({
            menuItemId: menuItemsMap[item.menuItemId.toString()] || null,
            isAvailable: item.isAvailable,
          })
        );
      }
    });

    res.status(200).json({
      message: `Menu for ${menu.dayName} retrieved successfully`,
      success: true,
      data: populatedMenu,
    });
  } catch (error) {
    console.error("Error getting menu for day:", error);
    res.status(500).json({
      message: "Failed to get menu for day",
      success: false,
      error: error.message,
    });
  }
};

// Get full week menu
const getFullWeekMenu = async (req, res) => {
  try {
    const weeklyMenus = await WeeklyMenu.getFullWeekMenu();

    res.status(200).json({
      message: "Full week menu retrieved successfully",
      success: true,
      data: weeklyMenus,
    });
  } catch (error) {
    console.error("Error getting full week menu:", error);
    res.status(500).json({
      message: "Failed to get full week menu",
      success: false,
      error: error.message,
    });
  }
};

// Create or update weekly menu for a specific day
const createOrUpdateWeeklyMenu = async (req, res) => {
  try {
    const { dayOfWeek, meals, specialNotes } = req.body;
    const dayNum = parseInt(dayOfWeek);

    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return res.status(400).json({
        message:
          "Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)",
        success: false,
      });
    }

    // Validate meal structure
    if (!meals || (!meals.breakfast && !meals.lunch && !meals.dinner)) {
      return res.status(400).json({
        message:
          "At least one meal (breakfast, lunch, or dinner) must be provided",
        success: false,
      });
    }

    // Validate menu items exist
    const allMenuItemIds = [];
    ["breakfast", "lunch", "dinner"].forEach((mealType) => {
      if (meals[mealType] && meals[mealType].items) {
        meals[mealType].items.forEach((item) => {
          if (item.menuItemId) {
            allMenuItemIds.push(item.menuItemId);
          }
        });
      }
    });

    if (allMenuItemIds.length > 0) {
      const menuItemsCount = await MenuItem.countDocuments({
        _id: { $in: allMenuItemIds },
      });

      if (menuItemsCount !== allMenuItemIds.length) {
        return res.status(400).json({
          message: "One or more menu items do not exist",
          success: false,
        });
      }
    }

    // Check if menu for this day already exists
    let weeklyMenu = await WeeklyMenu.findOne({ dayOfWeek: dayNum });

    if (weeklyMenu) {
      // Update existing menu
      weeklyMenu.meals = meals;
      weeklyMenu.specialNotes = specialNotes || weeklyMenu.specialNotes;
      weeklyMenu.isActive = true;
    } else {
      // Create new menu
      weeklyMenu = new WeeklyMenu({
        dayOfWeek: dayNum,
        dayName: WeeklyMenu.getDayName(dayNum),
        meals,
        specialNotes,
        createdBy: req.user._id,
        isActive: true,
      });
    }

    await weeklyMenu.save();

    // Populate the saved menu
    await weeklyMenu.populate([
      { path: "meals.breakfast.items.menuItemId" },
      { path: "meals.lunch.items.menuItemId" },
      { path: "meals.dinner.items.menuItemId" },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(weeklyMenu.isNew ? 201 : 200).json({
      message: `Weekly menu for ${weeklyMenu.dayName} ${
        weeklyMenu.isNew ? "created" : "updated"
      } successfully`,
      success: true,
      data: weeklyMenu,
    });
  } catch (error) {
    console.error("Error creating/updating weekly menu:", error);
    res.status(500).json({
      message: "Failed to create/update weekly menu",
      success: false,
      error: error.message,
    });
  }
};

// Delete weekly menu for a specific day (soft delete)
const deleteWeeklyMenu = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const dayNum = parseInt(dayOfWeek);

    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return res.status(400).json({
        message:
          "Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)",
        success: false,
      });
    }

    const weeklyMenu = await WeeklyMenu.findOne({ dayOfWeek: dayNum });

    if (!weeklyMenu) {
      return res.status(404).json({
        message: `No menu found for ${WeeklyMenu.getDayName(dayNum)}`,
        success: false,
      });
    }

    weeklyMenu.isActive = false;
    await weeklyMenu.save();

    res.status(200).json({
      message: `Weekly menu for ${weeklyMenu.dayName} deleted successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting weekly menu:", error);
    res.status(500).json({
      message: "Failed to delete weekly menu",
      success: false,
      error: error.message,
    });
  }
};

// Restore weekly menu for a specific day
const restoreWeeklyMenu = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const dayNum = parseInt(dayOfWeek);

    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return res.status(400).json({
        message:
          "Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)",
        success: false,
      });
    }

    const weeklyMenu = await WeeklyMenu.findOne({ dayOfWeek: dayNum });

    if (!weeklyMenu) {
      return res.status(404).json({
        message: `No menu found for ${WeeklyMenu.getDayName(dayNum)}`,
        success: false,
      });
    }

    weeklyMenu.isActive = true;
    await weeklyMenu.save();

    res.status(200).json({
      message: `Weekly menu for ${weeklyMenu.dayName} restored successfully`,
      success: true,
      data: weeklyMenu,
    });
  } catch (error) {
    console.error("Error restoring weekly menu:", error);
    res.status(500).json({
      message: "Failed to restore weekly menu",
      success: false,
      error: error.message,
    });
  }
};

// Copy menu from one day to another
const copyWeeklyMenu = async (req, res) => {
  try {
    const { fromDay, toDay } = req.body;
    const fromDayNum = parseInt(fromDay);
    const toDayNum = parseInt(toDay);

    if (
      isNaN(fromDayNum) ||
      fromDayNum < 0 ||
      fromDayNum > 6 ||
      isNaN(toDayNum) ||
      toDayNum < 0 ||
      toDayNum > 6
    ) {
      return res.status(400).json({
        message:
          "Invalid day of week. Must be between 0 (Sunday) and 6 (Saturday)",
        success: false,
      });
    }

    if (fromDayNum === toDayNum) {
      return res.status(400).json({
        message: "Cannot copy menu to the same day",
        success: false,
      });
    }

    const sourceMenu = await WeeklyMenu.findOne({
      dayOfWeek: fromDayNum,
      isActive: true,
    });

    if (!sourceMenu) {
      return res.status(404).json({
        message: `No menu found for ${WeeklyMenu.getDayName(fromDayNum)}`,
        success: false,
      });
    }

    // Check if target day menu exists
    let targetMenu = await WeeklyMenu.findOne({ dayOfWeek: toDayNum });

    if (targetMenu) {
      // Update existing menu
      targetMenu.meals = sourceMenu.meals;
      targetMenu.specialNotes = sourceMenu.specialNotes;
      targetMenu.isActive = true;
    } else {
      // Create new menu
      targetMenu = new WeeklyMenu({
        dayOfWeek: toDayNum,
        dayName: WeeklyMenu.getDayName(toDayNum),
        meals: sourceMenu.meals,
        specialNotes: sourceMenu.specialNotes,
        createdBy: req.user._id,
        isActive: true,
      });
    }

    await targetMenu.save();

    // Populate the saved menu
    await targetMenu.populate([
      { path: "meals.breakfast.items.menuItemId" },
      { path: "meals.lunch.items.menuItemId" },
      { path: "meals.dinner.items.menuItemId" },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(200).json({
      message: `Menu copied from ${WeeklyMenu.getDayName(
        fromDayNum
      )} to ${WeeklyMenu.getDayName(toDayNum)} successfully`,
      success: true,
      data: targetMenu,
    });
  } catch (error) {
    console.error("Error copying weekly menu:", error);
    res.status(500).json({
      message: "Failed to copy weekly menu",
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getTodaysMenu,
  getMenuForDay,
  getFullWeekMenu,
  createOrUpdateWeeklyMenu,
  deleteWeeklyMenu,
  restoreWeeklyMenu,
  copyWeeklyMenu,
};
