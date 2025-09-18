// app/middlewares/uploadAvatar.js
import multer from "multer";

/**
 * Dùng memoryStorage để lưu file trong RAM (req.file.buffer),
 * controller sẽ lấy buffer này ghi thẳng vào MongoDB.
 */
const storage = multer.memoryStorage();

/**
 * Chỉ cho phép các định dạng ảnh phổ biến.
 * (Tuỳ chọn: bạn có thể sniff vài byte đầu để cứng hơn)
 */
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Chỉ chấp nhận JPEG/PNG/WEBP"), false);
  }
  cb(null, true);
};

/**
 * Giới hạn size 2MB như cũ.
 * Field upload là "avatar".
 */
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");
