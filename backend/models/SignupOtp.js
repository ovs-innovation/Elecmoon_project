const mongoose = require("mongoose");

const signupOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
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

signupOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SignupOtp = mongoose.model("SignupOtp", signupOtpSchema);

module.exports = SignupOtp;
