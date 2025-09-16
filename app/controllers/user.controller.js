import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";


export const allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

export const userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

export const adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

export const moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};


// 📍 Lấy tất cả user (chỉ lấy user chưa bị xóa)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).populate("roles", "name");
    res.status(200).json(users);
  } catch (err) {
    console.error("❌ [GET USERS] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📍 Lấy user theo ID (chỉ lấy nếu chưa bị xóa)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).populate("roles", "name");
    if (!user) return res.status(404).json({ message: "User không tồn tại hoặc đã bị xóa." });
    res.status(200).json(user);
  } catch (err) {
    console.error("❌ [GET USER BY ID] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📍 Tạo user mới (Admin dùng)
export const createUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    // Kiểm tra email tồn tại
    const existing = await User.findOne({ email, isDeleted: false });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại." });

    const user = new User({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      roles,
    });

    await user.save();
    res.status(201).json({ message: "Tạo user thành công!", user });
  } catch (err) {
    console.error("❌ [CREATE USER] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📍 Cập nhật user
export const updateUser = async (req, res) => {
  try {
    const { username, email, password, roles, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại." });

    if (username) user.username = username;
    if (email) user.email = email;
    if (typeof isVerified !== "undefined") user.isVerified = isVerified;
    if (password) user.password = bcrypt.hashSync(password, 8);

    // Convert role names sang ObjectId
    if (roles && roles.length > 0) {
      const roleDocs = await Role.find({ name: { $in: roles } });
      user.roles = roleDocs.map(r => r._id);
    }

    await user.save();
    res.status(200).json({ message: "Cập nhật user thành công!", user });
  } catch (err) {
    console.error("❌ [UPDATE USER] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📍 Xóa user (soft delete → set isDeleted = true)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User không tồn tại." });

    res.status(200).json({ message: "User đã bị ẩn (soft delete)!", user });
  } catch (err) {
    console.error("❌ [DELETE USER] Error:", err);
    res.status(500).json({ message: err.message });
  }
};
// 📍 Khôi phục user đã xóa (soft delete)
export const restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User không tồn tại." });
    if (!user.isDeleted) return res.status(400).json({ message: "User này chưa bị xóa." });

    user.isDeleted = false;
    await user.save();

    res.status(200).json({ message: "Khôi phục user thành công!", user });
  } catch (err) {
    console.error("❌ [RESTORE USER] Error:", err);
    res.status(500).json({ message: err.message });
  }
};