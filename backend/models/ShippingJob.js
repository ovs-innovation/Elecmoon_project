const mongoose = require("mongoose");

/**
 * Durable Shiprocket fulfillment queue jobs.
 * In-process worker drains these; failed jobs escalate to DeadLetterJob.
 */
const shippingJobSchema = new mongoose.Schema(
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
      required: true,
      default: "auto",
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "dead", "skipped"],
      default: "queued",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    lastError: {
      type: String,
      default: "",
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lockedAt: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

shippingJobSchema.index({ status: 1, nextAttemptAt: 1 });
shippingJobSchema.index(
  { order: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["queued", "processing"] },
    },
  }
);

module.exports = mongoose.model("ShippingJob", shippingJobSchema);
