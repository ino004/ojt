import config from "../config/auth.config.js";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import transporter from "../config/mail.js";


export const signup = async (req, res) => {
  console.log("🚀 [SIGNUP] Hàm signup được gọi");
  try {
    console.log("📌 [SIGNUP] Nhận dữ liệu:", req.body);

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    // Gán role
    if (req.body.roles) {
      const roles = await Role.find({ name: { $in: req.body.roles } });
      user.roles = roles.map((role) => role._id);
    } else {
      const role = await Role.findOne({ name: "user" });
      user.roles = [role._id];
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // hết hạn sau 5 phút

    await user.save();
    console.log("✅ [SIGNUP] User đã lưu:", user._id);

    // Thử log checkpoint trước khi gửi mail
    console.log("🚀 [SIGNUP] Chuẩn bị vào block gửi mail...");

    try {
      console.log("📌 [SIGNUP] Chuẩn bị gửi mail tới:", user.email);

      const info = await transporter.sendMail({
        from: `"Support Team" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: "Xác thực tài khoản của bạn",
        html: `
          <h2>Xin chào ${user.username},</h2>
          <p>Mã OTP xác thực của bạn là: <b>${otp}</b></p>
          <p>OTP này có hiệu lực trong 5 phút.</p>
        `,
      });
      return res.status(201).send({ message: "Đăng ký thành công. Vui lòng kiểm tra email để nhập OTP xác thực!" });

      console.log("📩 [SIGNUP] Mail đã gửi thành công!", info.messageId);
    } catch (mailErr) {
      console.error("❌ [SIGNUP] Lỗi gửi mail:", mailErr);
    }

    console.log("🏁 [SIGNUP] Hoàn tất, trả response cho client");
    return res.status(201).send({ message: "Đăng ký thành công, vui lòng kiểm tra email!" });

  } catch (err) {
    console.error("❌ [SIGNUP] Lỗi:", err);
    return res.status(500).send({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).send({ message: "Không tìm thấy user!" });
    if (user.isVerified) return res.status(400).send({ message: "Tài khoản đã được xác thực!" });

    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).send({ message: "OTP không hợp lệ hoặc đã hết hạn!" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).send({ message: "Xác thực email thành công!" });

  } catch (err) {
    console.error("❌ [VERIFY OTP] Lỗi:", err);
    return res.status(500).send({ message: err.message });
  }
};


export const signin = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res
        .status(401)
        .send({ accessToken: null, message: "Invalid Password!" });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    let authorities = [];
    for (let i = 0; i < user.roles.length; i++) {
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
    }

    // Generate refresh token
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token,
      refreshToken,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh Token is required!" });
  }

  try {
    const user = await User.findOne({ refreshToken: requestToken });

    if (!user) {
      return res.status(403).json({ message: "Refresh token is not in database!" });
    }

    jwt.verify(requestToken, config.refreshSecret, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const newAccessToken = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400, // 24h
      });

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: requestToken,
      });
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, config.refreshSecret, {
    expiresIn: 604800, // 7 days
  });
}

// 1️⃣ Gửi email reset password
// 1️⃣ Gửi OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send({ message: "Email không tồn tại." });

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Thời gian hết hạn: 10 phút từ hiện tại
    const expireTime = Date.now() + 10 * 60 * 1000;

    // Lưu OTP và thời gian expire vào schema
    user.otp = otp;
    user.otpExpires = expireTime;
    await user.save();

    console.log("📌 [FORGOT PASSWORD] OTP vừa lưu:", user.otp, "Expire:", new Date(user.otpExpires));

    // Gửi mail
    const info = await transporter.sendMail({
      from: `"Support Team" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "OTP đặt lại mật khẩu",
      html: `
        <h2>Xin chào ${user.username},</h2>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.</p>
        <p>Mã OTP của bạn là: <b>${otp}</b></p>
        <p>OTP này có hiệu lực trong 10 phút.</p>
      `,
    });

    console.log("✅ [FORGOT PASSWORD] Mail OTP đã gửi. MessageId:", info.messageId);
    return res.status(200).send({ message: "OTP đã được gửi tới email của bạn!" });

  } catch (err) {
    console.error("❌ [FORGOT PASSWORD] Error:", err);
    return res.status(500).send({ message: err.message });
  }
};


// 2️⃣ Reset password bằng OTP
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 🔹 Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send({ message: "Email không tồn tại." });

    // 🔹 Debug log
    console.log("📌 [RESET PASSWORD] User document:", user);
    console.log("📌 [RESET PASSWORD] OTP từ DB:", user.otp);
    console.log("📌 [RESET PASSWORD] Expire từ DB:", new Date(user.otpExpires));
    console.log("📌 [RESET PASSWORD] OTP nhập:", otp);

    // 🔹 Kiểm tra OTP
    if (!user.otp || !user.otpExpires) {
      return res.status(400).send({ message: "Chưa có OTP hoặc OTP không hợp lệ." });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).send({ message: "OTP đã hết hạn." });
    }

    if (user.otp !== otp.toString()) {
      return res.status(400).send({ message: "OTP không đúng." });
    }

    // 🔹 Cập nhật password
    user.password = bcrypt.hashSync(newPassword, 8);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log("✅ [RESET PASSWORD] Mật khẩu đã đặt lại thành công cho:", email);
    return res.status(200).send({ message: "Mật khẩu đã được đặt lại thành công!" });

  } catch (err) {
    console.error("❌ [RESET PASSWORD] Error:", err);
    return res.status(500).send({ message: err.message });
  }
};
