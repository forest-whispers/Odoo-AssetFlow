import mongoose from "mongoose";
import "../src/config/env.js"; // Loads environment variables

const cleanDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI not defined in environment variables");
      process.exit(1);
    }
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    
    console.log("Dropping the database...");
    await mongoose.connection.db.dropDatabase();
    
    console.log("Database dropped and cleared successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning database:", error);
    process.exit(1);
  }
};

cleanDB();