import dotenv from "dotenv";
dotenv.config();

export default {
  secret: process.env.JWT_SECRET  || "fallback-secret",
  refreshSecret: process.env.REFRESH_SECRET  || "defaultRefreshSecret",
};