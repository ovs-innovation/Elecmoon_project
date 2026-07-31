const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    event: { type: String, required: true },
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

const pendingPaymentSchema = new mongoose.Schema(
  {
    merchantTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    orderPayload: {
      type: Object,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountPaise: {
      type: Number,
      required: false,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },
    paymentState: {
      type: String,
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    phonepeTransactionId: {
      type: String,
      default: "",
      index: true,
    },
    response: {
      type: Object,
      default: {},
    },
    callbackResponse: {
      type: Object,
      default: {},
    },
    verifiedAt: {
      type: Date,
      required: false,
    },
    failureReason: {
      type: String,
      default: "",
    },
    logs: {
      type: [logSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PendingPayment", pendingPaymentSchema);
