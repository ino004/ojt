import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
const AutoIncrement = AutoIncrementFactory(mongoose);

const UserSchema = new mongoose.Schema({
  _id: Number,  // dùng số thay vì ObjectId
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
  ],
  refreshToken: { 
    type: String 
  },
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpires: { 
    type: Date 
  },
  otp: {               // 🔥 OTP gửi qua mail
    type: String,
  },
  otpExpires: {        // 🔥 Thời gian hết hạn OTP
    type: Date,
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  }, // Xác thực mail
  isDeleted: { type: Boolean, default: false }
}, { _id: false, timestamps: true }); // tự động tạo createdAt, updatedAt
UserSchema.plugin(AutoIncrement, { id: "user_seq", inc_field: "_id" });
const User = mongoose.model("User", UserSchema);

export default User;