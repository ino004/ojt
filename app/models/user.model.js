import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
const AutoIncrement = AutoIncrementFactory(mongoose);
const UserSchema = new mongoose.Schema({
  _id: Number,
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
  ],
  refreshToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  // ✅ Thêm avatarUrl
  avatar: {
    data: Buffer,
    contentType: String,
  },
});


UserSchema.plugin(AutoIncrement, { id: "user_seq", inc_field: "_id" });

const User = mongoose.model("User", UserSchema);

export default User;