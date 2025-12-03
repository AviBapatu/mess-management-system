const { MenuItem } = require("../models");
const { normalizeName } = require("../utils/text");

const getAllMenuItems = async (req, res) => {
  try {
    const { category, isAvailable } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";

    const menuItems = await MenuItem.find(filter).sort({ createdAt: -1 });

    res.json({
      message: "Menu items fetched successfully",
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({
      message: "Error fetching menu items",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const createMenuItem = async (req, res) => {
  try {
  const { name, price, category, description, isAvailable, aliases } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        message: "Name and price are required",
      });
    }

    // Check if item already exists
    const existingItem = await MenuItem.findOne({
      $or: [
        { name: name.trim() },
        { nameNormalized: normalizeName(name) },
      ],
    });

    if (existingItem) {
      return res.status(409).json({
        message: "Menu item with this name already exists",
      });
    }

    const menuItem = new MenuItem({
      name: name.trim(),
      price: parseFloat(price),
      category: category?.trim() || "General",
      description: description?.trim(),
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      aliases: Array.isArray(aliases) ? aliases : [],
    });

    await menuItem.save();

    res.status(201).json({
      message: "Menu item created successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Create menu item error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      message: "Error creating menu item",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const updateMenuItem = async (req, res) => {
  try {
  const { id } = req.params;
  const { name, price, category, description, isAvailable, aliases } = req.body;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== menuItem.name) {
      const existingItem = await MenuItem.findOne({
        $or: [
          { name: name.trim() },
          { nameNormalized: normalizeName(name) },
        ],
        _id: { $ne: id },
      });

      if (existingItem) {
        return res.status(409).json({
          message: "Menu item with this name already exists",
        });
      }
    }

    // Update fields
    if (name) menuItem.name = name.trim();
    if (price !== undefined) menuItem.price = parseFloat(price);
    if (category) menuItem.category = category.trim();
  if (description !== undefined) menuItem.description = description.trim();
  if (aliases !== undefined) menuItem.aliases = Array.isArray(aliases) ? aliases : [];
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

    await menuItem.save();

    res.json({
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      message: "Error updating menu item",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    await MenuItem.findByIdAndDelete(id);

    res.json({
      message: "Menu item deleted successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({
      message: "Error deleting menu item",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    res.json({
      message: "Menu item fetched successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({
      message: "Error fetching menu item",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

// POST /api/menu/bulk-upsert
// Body: { items: [{ name, price, category?, description?, isAvailable?, aliases?: [..] }] }
// Upserts by normalized name; creates or updates existing records.
const bulkUpsertMenuItems = async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }

    const ops = [];
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const name = String(raw.name || "").trim();
      const price = Number(raw.price);
      if (!name || !Number.isFinite(price)) continue;

      const nameNorm = normalizeName(name);
      const update = {
        name,
        nameNormalized: nameNorm,
        price,
      };
      if (raw.category != null) update.category = String(raw.category).trim();
      if (raw.description != null)
        update.description = String(raw.description).trim();
      if (raw.isAvailable != null) update.isAvailable = !!raw.isAvailable;
      if (raw.aliases != null)
        update.aliases = Array.isArray(raw.aliases)
          ? raw.aliases.map((a) => String(a || "").trim()).filter(Boolean)
          : [];

      ops.push({
        updateOne: {
          filter: {
            $or: [{ nameNormalized: nameNorm }, { name: name }],
          },
          update: { $set: update },
          upsert: true,
        },
      });
    }

    if (ops.length === 0) {
      return res.status(400).json({ message: "No valid items to upsert" });
    }

    const result = await MenuItem.bulkWrite(ops, { ordered: false });
    return res.json({
      message: "Menu items upserted",
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
      result,
    });
  } catch (error) {
    console.error("Bulk upsert menu items error:", error);
    return res.status(500).json({
      message: "Error upserting menu items",
      error: process.env.NODE_ENV === "production" ? {} : error.message,
    });
  }
};

module.exports = {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById,
  bulkUpsertMenuItems,
};
