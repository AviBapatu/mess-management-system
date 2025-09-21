const { DailyMenu, MenuItem } = require("../models");

// Get daily menu for a specific date
const getDailyMenu = async (req, res) => {
  try {
    const { date } = req.params;

    let menu;
    if (date === "today") {
      menu = await DailyMenu.getTodaysMenu();
    } else {
      menu = await DailyMenu.getMenuForDate(date);
    }

    if (!menu) {
      return res.status(404).json({
        message: "No menu found for the specified date",
      });
    }

    res.json({
      message: "Daily menu fetched successfully",
      data: menu,
    });
  } catch (error) {
    console.error("Error fetching daily menu:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all daily menus with pagination
const getAllDailyMenus = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, isActive } = req.query;

    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: [
        {
          path: "meals.breakfast.items.menuItemId",
          select: "name price category",
        },
        {
          path: "meals.lunch.items.menuItemId",
          select: "name price category",
        },
        {
          path: "meals.dinner.items.menuItemId",
          select: "name price category",
        },
        {
          path: "createdBy",
          select: "name email",
        },
      ],
    };

    const skip = (options.page - 1) * options.limit;
    const menus = await DailyMenu.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .skip(skip)
      .limit(options.limit);

    const total = await DailyMenu.countDocuments(filter);

    res.json({
      message: "Daily menus fetched successfully",
      data: menus,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
        limit: options.limit,
      },
    });
  } catch (error) {
    console.error("Error fetching daily menus:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create a new daily menu
const createDailyMenu = async (req, res) => {
  try {
    const { date, meals, specialNotes } = req.body;

    // Validate required fields
    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    // Check if menu already exists for this date
    const existingMenu = await DailyMenu.findOne({
      date: new Date(date),
      isActive: true,
    });

    if (existingMenu) {
      return res.status(400).json({
        message: "Menu already exists for this date. Use update instead.",
      });
    }

    // Validate menu items exist
    const allMenuItemIds = [];
    if (meals?.breakfast?.items) {
      allMenuItemIds.push(
        ...meals.breakfast.items.map((item) => item.menuItemId)
      );
    }
    if (meals?.lunch?.items) {
      allMenuItemIds.push(...meals.lunch.items.map((item) => item.menuItemId));
    }
    if (meals?.dinner?.items) {
      allMenuItemIds.push(...meals.dinner.items.map((item) => item.menuItemId));
    }

    const existingMenuItems = await MenuItem.find({
      _id: { $in: allMenuItemIds },
    });

    if (existingMenuItems.length !== allMenuItemIds.length) {
      return res.status(400).json({
        message: "One or more menu items do not exist",
      });
    }

    const dailyMenu = new DailyMenu({
      date: new Date(date),
      meals: meals || {
        breakfast: { items: [], isActive: true },
        lunch: { items: [], isActive: true },
        dinner: { items: [], isActive: true },
      },
      specialNotes,
      createdBy: req.user._id,
    });

    await dailyMenu.save();

    // Populate the response
    const populatedMenu = await DailyMenu.findById(dailyMenu._id)
      .populate("meals.breakfast.items.menuItemId")
      .populate("meals.lunch.items.menuItemId")
      .populate("meals.dinner.items.menuItemId")
      .populate("createdBy", "name email");

    res.status(201).json({
      message: "Daily menu created successfully",
      data: populatedMenu,
    });
  } catch (error) {
    console.error("Error creating daily menu:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Menu already exists for this date",
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a daily menu
const updateDailyMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { meals, specialNotes, isActive } = req.body;

    const dailyMenu = await DailyMenu.findById(id);

    if (!dailyMenu) {
      return res.status(404).json({
        message: "Daily menu not found",
      });
    }

    // Validate menu items if provided
    if (meals) {
      const allMenuItemIds = [];
      if (meals?.breakfast?.items) {
        allMenuItemIds.push(
          ...meals.breakfast.items.map((item) => item.menuItemId)
        );
      }
      if (meals?.lunch?.items) {
        allMenuItemIds.push(
          ...meals.lunch.items.map((item) => item.menuItemId)
        );
      }
      if (meals?.dinner?.items) {
        allMenuItemIds.push(
          ...meals.dinner.items.map((item) => item.menuItemId)
        );
      }

      if (allMenuItemIds.length > 0) {
        const existingMenuItems = await MenuItem.find({
          _id: { $in: allMenuItemIds },
        });

        if (existingMenuItems.length !== allMenuItemIds.length) {
          return res.status(400).json({
            message: "One or more menu items do not exist",
          });
        }
      }
    }

    // Update fields
    if (meals) dailyMenu.meals = meals;
    if (specialNotes !== undefined) dailyMenu.specialNotes = specialNotes;
    if (isActive !== undefined) dailyMenu.isActive = isActive;

    await dailyMenu.save();

    // Populate the response
    const populatedMenu = await DailyMenu.findById(dailyMenu._id)
      .populate("meals.breakfast.items.menuItemId")
      .populate("meals.lunch.items.menuItemId")
      .populate("meals.dinner.items.menuItemId")
      .populate("createdBy", "name email");

    res.json({
      message: "Daily menu updated successfully",
      data: populatedMenu,
    });
  } catch (error) {
    console.error("Error updating daily menu:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete a daily menu (soft delete)
const deleteDailyMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const dailyMenu = await DailyMenu.findById(id);

    if (!dailyMenu) {
      return res.status(404).json({
        message: "Daily menu not found",
      });
    }

    // Soft delete by setting isActive to false
    dailyMenu.isActive = false;
    await dailyMenu.save();

    res.json({
      message: "Daily menu deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting daily menu:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Clone menu from another date
const cloneDailyMenu = async (req, res) => {
  try {
    const { sourceDate, targetDate } = req.body;

    if (!sourceDate || !targetDate) {
      return res.status(400).json({
        message: "Both source date and target date are required",
      });
    }

    // Get source menu
    const sourceMenu = await DailyMenu.getMenuForDate(sourceDate);
    if (!sourceMenu) {
      return res.status(404).json({
        message: "Source menu not found",
      });
    }

    // Check if target menu already exists
    const existingMenu = await DailyMenu.findOne({
      date: new Date(targetDate),
      isActive: true,
    });

    if (existingMenu) {
      return res.status(400).json({
        message: "Menu already exists for target date",
      });
    }

    // Create new menu with source data
    const newMenu = new DailyMenu({
      date: new Date(targetDate),
      meals: sourceMenu.meals,
      specialNotes: sourceMenu.specialNotes,
      createdBy: req.user._id,
    });

    await newMenu.save();

    // Populate the response
    const populatedMenu = await DailyMenu.findById(newMenu._id)
      .populate("meals.breakfast.items.menuItemId")
      .populate("meals.lunch.items.menuItemId")
      .populate("meals.dinner.items.menuItemId")
      .populate("createdBy", "name email");

    res.status(201).json({
      message: "Daily menu cloned successfully",
      data: populatedMenu,
    });
  } catch (error) {
    console.error("Error cloning daily menu:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getDailyMenu,
  getAllDailyMenus,
  createDailyMenu,
  updateDailyMenu,
  deleteDailyMenu,
  cloneDailyMenu,
};
