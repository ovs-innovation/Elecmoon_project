const express = require("express");
const router = express.Router();
const {
  loginCustomer,
  sendLoginOtp,
  verifyLoginOtp,
  sendSignupOtp,
  verifySignupOtp,
  registerCustomer,
  verifyPhoneNumber,
  signUpWithProvider,
  signUpWithOauthProvider,
  verifyEmailAddress,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addAllCustomers,
  addShippingAddress,
  getShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  saveCart,
  getCart,
  saveWishlist,
  getWishlist,
} = require("../controller/customerController");
const {
  passwordVerificationLimit,
  emailVerificationLimit,
  phoneVerificationLimit,
  loginOtpLimit,
} = require("../lib/email-sender/sender");
const {
  adminOnly,
  isAuth,
  ensureSelfOrAdmin,
  ensureSelfEmail,
} = require("../config/auth");

// Public auth routes
router.post("/verify-email", emailVerificationLimit, verifyEmailAddress);
router.post("/verify-phone", phoneVerificationLimit, verifyPhoneNumber);
router.post("/register/:token", registerCustomer);
router.post("/login", loginCustomer);
router.post("/login/otp/send", loginOtpLimit, sendLoginOtp);
router.post("/login/otp/verify", loginOtpLimit, verifyLoginOtp);
router.post("/signup/otp/send", loginOtpLimit, sendSignupOtp);
router.post("/signup/otp/verify", loginOtpLimit, verifySignupOtp);
router.post("/signup/oauth", signUpWithOauthProvider);
router.post("/signup/:token", signUpWithProvider);
router.put("/forget-password", passwordVerificationLimit, forgetPassword);
router.put("/reset-password", resetPassword);

// Customer self-service (authenticated + ownership)
router.post("/change-password", isAuth, ensureSelfEmail, changePassword);
router.post("/shipping/address/:id", isAuth, ensureSelfOrAdmin, addShippingAddress);
router.get("/shipping/address/:id", isAuth, ensureSelfOrAdmin, getShippingAddress);
router.put(
  "/shipping/address/:userId/:shippingId",
  isAuth,
  ensureSelfOrAdmin,
  updateShippingAddress
);
router.delete(
  "/shipping/address/:userId/:shippingId",
  isAuth,
  ensureSelfOrAdmin,
  deleteShippingAddress
);
router.get("/cart/:id", isAuth, ensureSelfOrAdmin, getCart);
router.put("/cart/:id", isAuth, ensureSelfOrAdmin, saveCart);
router.get("/wishlist/:id", isAuth, ensureSelfOrAdmin, getWishlist);
router.put("/wishlist/:id", isAuth, ensureSelfOrAdmin, saveWishlist);
router.put("/:id", isAuth, ensureSelfOrAdmin, updateCustomer);

// Admin-only customer management
router.post("/add/all", adminOnly, addAllCustomers);
router.get("/", adminOnly, getAllCustomers);
router.get("/:id", adminOnly, getCustomerById);
router.delete("/:id", adminOnly, deleteCustomer);

module.exports = router;
