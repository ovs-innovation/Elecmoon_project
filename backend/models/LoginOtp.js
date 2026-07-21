const mongoose = require("mongoose");

const loginOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

loginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LoginOtp = mongoose.model("LoginOtp", loginOtpSchema);

module.exports = LoginOtp;
