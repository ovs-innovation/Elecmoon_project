const express = require("express");
const router = express.Router();
const {
  addOrder,
  getOrderById,
  getOrderCustomer,
  createPaymentIntent,
  addRazorpayOrder,
  createOrderByRazorPay,
  verifyRazorpayPaymentAndAddOrder,
  sendEmailInvoiceToCustomer,
  createPhonePePayment,
  phonePeCallback,
  phonePeWebhook,
  verifyPhonePePayment,
  phonePeMockCheckout,
} = require("../controller/customerOrderController");

const { emailVerificationLimit } = require("../lib/email-sender/sender");

//add a order
router.post("/add", addOrder);

// PhonePe endpoints
router.post("/create-phonepe-payment", createPhonePePayment);
router.all("/phonepe/callback", phonePeCallback);
router.post("/phonepe/webhook", phonePeWebhook);
router.post("/verify/phonepe", verifyPhonePePayment);
router.all("/phonepe/mock-checkout", phonePeMockCheckout);

// create stripe payment intent
router.post("/create-payment-intent", createPaymentIntent);

// legacy endpoint disabled — use /verify/razorpay after payment
router.post("/add/razorpay", addRazorpayOrder);

// create Razorpay payment order (not a store order)
router.post("/create/razorpay", createOrderByRazorPay);

// secure verify + create order (after payment success)
router.post("/verify/razorpay", verifyRazorpayPaymentAndAddOrder);

//get a order by id
router.get("/:id", getOrderById);

//get all order by a user
router.get("/", getOrderCustomer);

//#send email invoice to customer
router.post(
  "/customer/invoice",
  emailVerificationLimit,
  sendEmailInvoiceToCustomer
);

module.exports = router;
