import mongoose from "mongoose";
import connectDB from "../config/db.js";
import roleModel from "./role.model.js";  
import userModel from "./user.model.js"; 

// gọi connectDB() để kết nối
connectDB().then(() => {
  initial();
});

const db = {};
db.mongoose = mongoose;
db.user = userModel;
db.role = roleModel;
db.ROLES = ["user", "admin", "moderator"];

export default db;

// tạo roles mặc định nếu chưa có
async function initial() {
  try {
    const count = await db.role.estimatedDocumentCount();
    if (count === 0) {
      await new db.role({ name: "user" }).save();
      await new db.role({ name: "admin" }).save();
      await new db.role({ name: "moderator" }).save();
      console.log("✅ Default roles created");
    }
  } catch (err) {
    console.error("❌ Error creating default roles:", err);
  }
}