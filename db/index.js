const mongoose = require("mongoose");

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.DATABASE_NAME,
    });

    console.log(
      "😍 Connected to MongoDB at :- ",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("❌ Could not connect to MongoDB", error);
    process.exit(1);
  }
}

module.exports = connectDB;
