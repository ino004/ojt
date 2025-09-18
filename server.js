import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// DB
import db from "./app/models/index.js";

// Swagger
import { swaggerDocs } from "./swagger.js";
swaggerDocs(app);

// Routes
import authRoutes from "./app/routes/auth.routes.js";
import userRoutes from "./app/routes/user.routes.js";

// 🔥 dùng app.use chứ không phải authRoutes(app) nữa
app.use("/api/auth", authRoutes);
//app.use("/api/test", userRoutes);
app.use("/api/users", userRoutes);

// test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Node.js + MongoDB app 🚀" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});