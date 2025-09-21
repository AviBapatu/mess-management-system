const mongoose = require("mongoose");
require("dotenv").config();
const { User } = require("./src/models");

const testDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    console.log(`Found ${users.length} users in database:`);

    users.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
  } catch (error) {
    console.error("Database test error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

testDB();
