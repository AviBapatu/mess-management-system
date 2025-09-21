const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { User, MenuItem, Transaction } = require("./src/models");

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Transaction.deleteMany({});
    console.log("Cleared existing data");

    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@mess.com",
      password: "admin123", // Let the User model handle hashing
      role: "admin",
    });

    // Create regular users
    const userPromises = [
      User.create({
        name: "John Doe",
        email: "john@example.com",
        password: "user123",
        role: "user",
      }),
      User.create({
        name: "Jane Smith",
        email: "jane@example.com",
        password: "user123",
        role: "user",
      }),
      User.create({
        name: "Mike Johnson",
        email: "mike@example.com",
        password: "user123",
        role: "user",
      }),
      User.create({
        name: "Sarah Wilson",
        email: "sarah@example.com",
        password: "user123",
        role: "user",
      }),
    ];

    const users = await Promise.all(userPromises);

    console.log("Created users");

    // Create menu items
    const menuItems = await MenuItem.insertMany([
      {
        name: "Breakfast Combo",
        price: 45,
        category: "Breakfast",
        description: "Eggs, toast, and coffee",
      },
      {
        name: "Lunch Special",
        price: 65,
        category: "Lunch",
        description: "Rice, curry, and vegetables",
      },
      {
        name: "Dinner Deluxe",
        price: 95,
        category: "Dinner",
        description: "Full course dinner with dessert",
      },
      {
        name: "Chicken Sandwich",
        price: 55,
        category: "Snacks",
        description: "Grilled chicken sandwich with fries",
      },
      {
        name: "Vegetarian Thali",
        price: 75,
        category: "Lunch",
        description: "Complete vegetarian meal",
      },
      {
        name: "Fresh Juice",
        price: 30,
        category: "Beverages",
        description: "Freshly squeezed orange juice",
      },
      {
        name: "Pizza Slice",
        price: 40,
        category: "Snacks",
        description: "Margherita pizza slice",
      },
      {
        name: "Soup of the Day",
        price: 25,
        category: "Soups",
        description: "Daily special soup",
      },
    ]);

    console.log("Created menu items");

    // Create sample transactions for the last 30 days
    const transactions = [];
    const today = new Date();

    for (let i = 0; i < 50; i++) {
      // Random date within last 30 days
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - randomDaysAgo);

      // Random user
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Random number of items (1-3)
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const transactionItems = [];
      let total = 0;

      for (let j = 0; j < itemCount; j++) {
        const randomMenuItem =
          menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity

        transactionItems.push({
          name: randomMenuItem.name,
          price: randomMenuItem.price,
          quantity,
        });

        total += randomMenuItem.price * quantity;
      }

      transactions.push({
        userId: randomUser._id,
        items: transactionItems,
        total: Math.round(total * 100) / 100,
        status: "completed",
        createdAt: transactionDate,
      });
    }

    await Transaction.insertMany(transactions);
    console.log("Created sample transactions");

    console.log("✅ Database seeded successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("Admin: admin@mess.com / admin123");
    console.log("User: john@example.com / user123");
    console.log("User: jane@example.com / user123");
    console.log("User: mike@example.com / user123");
    console.log("User: sarah@example.com / user123");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedData();
