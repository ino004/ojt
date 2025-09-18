import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import transporter from "../config/mail.js";

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
// 📍 Cập nhật user (Admin dùng) – KHÔNG cho phép đổi password
export const updateUser = async (req, res) => {
  try {
    const { username, email, roles, isVerified, password } = req.body;

    // 🚫 Admin không được phép đổi mật khẩu của user
    if (typeof password !== "undefined") {
      return res.status(403).json({ message: "Admin không được phép cập nhật mật khẩu của user." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại." });

    if (username) user.username = username;
    if (email) user.email = email;
    if (typeof isVerified !== "undefined") user.isVerified = isVerified;

    // Admin vẫn có quyền đổi roles
    if (roles && roles.length > 0) {
      const roleDocs = await Role.find({ name: { $in: roles } });
      user.roles = roleDocs.map((r) => r._id);
    }

    await user.save();
    const safeUser = await User.findById(user._id).select("-password").populate("roles", "name");

    res.status(200).json({ message: "Cập nhật user thành công!", user: safeUser });
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

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userObj = user.toObject();
    userObj.avatarUrl = buildAvatarUrl(req, userObj);

    res.json(userObj);
  } catch (err) {
    console.error("❌ [GET MY PROFILE] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📍 Cập nhật hồ sơ của chính mình (chỉ đổi password khi nhập đúng mật khẩu cũ)
export const updateMyProfile = async (req, res) => {
  try {
    const FORBIDDEN_FIELDS = new Set([
      "_id", "roles", "isVerified", "isDeleted", "email",
      "refreshToken", "resetPasswordToken", "resetPasswordExpires",
      "otp", "otpExpires", "createdAt", "updatedAt", "__v"
    ]);

    const me = await User.findOne({ _id: req.userId, isDeleted: false });
    if (!me) return res.status(404).json({ message: "Không tìm thấy hồ sơ." });

    const { password, currentPassword } = req.body;
    const patchKeys = Object.keys(req.body);

    // Áp các giá trị mới (trừ password & field cấm)
    for (const key of patchKeys) {
      if (key === "password" || key === "currentPassword") continue;
      if (FORBIDDEN_FIELDS.has(key)) continue;
      if (typeof req.body[key] !== "undefined") {
        me[key] = req.body[key];
      }
    }

    // ✅ Nếu có yêu cầu đổi password
    if (typeof password !== "undefined") {
      if (!currentPassword) {
        return res.status(400).json({ message: "Vui lòng nhập mật khẩu cũ để đổi mật khẩu." });
      }

      const isMatch = await bcrypt.compare(currentPassword, me.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không chính xác." });
      }

      me.password = bcrypt.hashSync(password, 8);
    }

    await me.save();

    const safeUser = await User.findById(me._id)
      .select("-password")
      .populate("roles", "name");

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công!",
      user: safeUser,
    });
  } catch (err) {
    console.error("❌ [UPDATE ME] Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateMyAvatar = async (req, res) => {
  try {
    // multer (uploadAvatar) sẽ gắn file vào req.file
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file avatar (field: avatar)." });
    }

    const me = await User.findById(req.userId);
    if (!me || me.isDeleted) {
      return res.status(404).json({ message: "Không tìm thấy user." });
    }

    // Xoá file cũ nếu có (tuỳ bạn lưu ở field nào — ví dụ 'avatar')
    if (me.avatar) {
      const oldPath = path.join(process.cwd(), me.avatar.startsWith("uploads") ? me.avatar : me.avatar.replace(/^\//, ""));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    // Lưu đường dẫn mới (gợi ý lưu đường dẫn tương đối để serve static)
    // uploadAvatar.js đã đặt thư mục uploads/avatars và tên file rồi
const relativePath = `uploads/avatars/${req.file.filename}`; // luôn forward slash
me.avatar = relativePath;
await me.save();

const baseUrl = `${req.protocol}://${req.get("host")}`;
return res.status(200).json({
  message: "Cập nhật avatar thành công!",
  avatar: `/${relativePath}`,
  avatarUrl: `${baseUrl}/${relativePath}`,
});
  } catch (err) {
    console.error("❌ [UPDATE MY AVATAR] Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

function buildAvatarUrl(req, userObj) {
  if (userObj?.avatar) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Chuẩn hoá backslash nếu chạy Windows
    return `${baseUrl}/${userObj.avatar.replace(/\\/g, "/")}`;
  }
  return null; // có thể trả về default nếu muốn
}
