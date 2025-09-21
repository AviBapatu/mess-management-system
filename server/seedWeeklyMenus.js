const mongoose = require("mongoose");
const WeeklyMenu = require("./src/models/WeeklyMenu");
const MenuItem = require("./src/models/MenuItem");
const User = require("./src/models/User");
require("dotenv").config();

const seedWeeklyMenus = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing weekly menus
    await WeeklyMenu.deleteMany({});
    console.log("Cleared existing weekly menus");

    // Get some menu items and admin user
    const menuItems = await MenuItem.find({ isAvailable: true }).limit(10);
    const admin = await User.findOne({ role: "admin" });

    if (!admin) {
      console.error("No admin user found. Please create an admin user first.");
      return;
    }

    if (menuItems.length === 0) {
      console.error("No menu items found. Please seed menu items first.");
      return;
    }

    // Create sample weekly menus for each day
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const weeklyMenu = new WeeklyMenu({
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        meals: {
          breakfast: {
            items: menuItems.slice(0, 3).map((item) => ({
              menuItemId: item._id,
              isAvailable: true,
            })),
            isActive: true,
          },
          lunch: {
            items: menuItems.slice(3, 6).map((item) => ({
              menuItemId: item._id,
              isAvailable: true,
            })),
            isActive: true,
          },
          dinner: {
            items: menuItems.slice(6, 9).map((item) => ({
              menuItemId: item._id,
              isAvailable: true,
            })),
            isActive: true,
          },
        },
        specialNotes: `Special menu for ${dayNames[dayOfWeek]}`,
        createdBy: admin._id,
        isActive: true,
      });

      await weeklyMenu.save();
      console.log(`Created weekly menu for ${dayNames[dayOfWeek]}`);
    }

    console.log("✅ Weekly menus seeded successfully!");
    console.log(
      "Now you can view and manage weekly recurring menus in the admin dashboard."
    );
  } catch (error) {
    console.error("Error seeding weekly menus:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

seedWeeklyMenus();
