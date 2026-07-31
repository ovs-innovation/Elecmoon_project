const express = require("express");
const router = express.Router();
const {
  addOrder,
  getOrderById,
  getOrderCustomer,
  sendEmailInvoiceToCustomer,
  createPhonePePayment,
  phonePeCallback,
  phonePeWebhook,
  verifyPhonePePayment,
  phonePeMockCheckout,
  expirePendingPayments,
} = require("../controller/customerOrderController");

const { emailVerificationLimit } = require("../lib/email-sender/sender");

router.post("/add", addOrder);

router.post("/create-phonepe-payment", createPhonePePayment);
router.all("/phonepe/callback", phonePeCallback);
router.post("/phonepe/webhook", phonePeWebhook);
router.post("/verify/phonepe", verifyPhonePePayment);
router.all("/phonepe/mock-checkout", phonePeMockCheckout);

// Scheduled cleanup (Vercel Cron / external scheduler)
router.all("/payments/expire-pending", expirePendingPayments);

router.get("/:id", getOrderById);
router.get("/", getOrderCustomer);

router.post(
  "/customer/invoice",
  emailVerificationLimit,
  sendEmailInvoiceToCustomer
);

module.exports = router;
