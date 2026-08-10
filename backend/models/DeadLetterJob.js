const mongoose = require("mongoose");

/**
 * Dead-letter queue for Shiprocket jobs that exhausted retries.
 */
const deadLetterJobSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: false,
      index: true,
    },
    source: {
      type: String,
      default: "auto",
    },
    shippingJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingJob",
      required: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: "",
    },
    payload: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      enum: ["open", "requeued", "resolved", "discarded"],
      default: "open",
      index: true,
    },
    resolvedAt: {
      type: Date,
      required: false,
    },
    resolvedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

deadLetterJobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("DeadLetterJob", deadLetterJobSchema);
