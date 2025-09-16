import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";

const User = db.user;
const Role = db.role;

export const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"]; // Lấy token từ header Authorization

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Loại bỏ tiền tố 'Bearer '
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId); // lấy user từ token
    if (!user) return res.status(404).json({ message: "User not found." });

    const roles = await Role.find({ _id: { $in: user.roles } });

    const isAdmin = roles.some((role) => role.name === "admin")
    if (!isAdmin) return res.status(403).json({ message: "Require Admin Role!" });

    next();
  } catch (err) {
    console.error("❌ [isAdmin] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const isModerator = (req, res, next) => {
  User.findById(req.userId).populate("roles").exec((err, user) => {
    if (err) return res.status(500).send({ message: err });

    if (user.roles.some((r) => r.name === "moderator")) {
      next();
      return;
    }
    res.status(403).send({ message: "Require Moderator Role!" });
  });
};