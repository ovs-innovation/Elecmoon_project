const mongoose = require("mongoose");

/**
 * Idempotency records for Shiprocket webhooks (and reusable for other providers).
 */
const webhookIdempotencySchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      default: "shiprocket",
      index: true,
    },
    eventKey: {
      type: String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    orderId: {
      type: String,
      required: false,
    },
    statusApplied: {
      type: String,
      default: "",
    },
    payloadDigest: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

webhookIdempotencySchema.index(
  { provider: 1, eventKey: 1 },
  { unique: true }
);

// TTL: auto-purge webhook idempotency records after 90 days
webhookIdempotencySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports = mongoose.model("WebhookIdempotency", webhookIdempotencySchema);
