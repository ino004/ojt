import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // <- phải có để load .env khi import trực tiếp file này

const connectDB = async () => {
  try {
    const uri = process.env.DB_CONNECTION;
    console.log("🔑 DB_CONNECTION in db.js =", uri); // debug
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;