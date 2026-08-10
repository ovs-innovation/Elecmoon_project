const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    orderId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    invoice: {
      type: Number,
      required: false,
    },
    cart: [{}],
    user_info: {
      name: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
      contact: {
        type: String,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      country: {
        type: String,
        required: false,
      },
      zipCode: {
        type: String,
        required: false,
      },
    },
    subTotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },
    shippingOption: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentMethodDetail: {
      type: String,
      required: false,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
        // legacy lowercase values (pre-migration)
        "pending",
        "processing_confirmation",
        "paid",
        "failed",
      ],
      default: "PENDING",
      index: true,
    },
    phonepeMerchantId: {
      type: String,
      required: false,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: false,
      index: true,
    },
    amount: {
      type: Number,
      required: false,
    },
    currency: {
      type: String,
      default: "INR",
    },
    cardInfo: {
      type: Object,
      required: false,
    },
    // PhonePe payment fields for traceability + idempotency
    phonepeMerchantTransactionId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    phonepeMerchantOrderId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    phonepeOrderId: {
      type: String,
      required: false,
    },
    phonepeTransactionId: {
      type: String,
      required: false,
    },
    phonepeResponseCode: {
      type: String,
      required: false,
    },
    paymentResponse: {
      type: Object,
      required: false,
      default: {},
    },
    verifiedAt: {
      type: Date,
      required: false,
    },
    failureReason: {
      type: String,
      required: false,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Cancelled", "Delivered", "Cancel"],
      default: "Pending",
    },
    deliveryStatus: {
      type: String,
      enum: [
        "Pending",
        "Ready To Ship",
        "Shipped",
        "In Transit",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      required: false,
    },
    shiprocketOrderId: {
      type: String,
      required: false,
      index: true,
    },
    shiprocketShipmentId: {
      type: String,
      required: false,
      index: true,
    },
    shiprocketStatus: {
      type: String,
      required: false,
    },
    awbCode: {
      type: String,
      required: false,
      index: true,
    },
    courierName: {
      type: String,
      required: false,
      default: "",
    },
    trackingUrl: {
      type: String,
      required: false,
      default: "",
    },
    shiprocketPickupScheduled: {
      type: Boolean,
      required: false,
      default: false,
    },
    shiprocketFulfillmentStatus: {
      type: String,
      enum: ["IDLE", "PROCESSING", "COMPLETED", "FAILED"],
      required: false,
      default: "IDLE",
    },
    shiprocketFulfillmentError: {
      type: String,
      required: false,
      default: "",
    },
    shiprocketLastWebhookAt: {
      type: Date,
      required: false,
    },
    shiprocketLastWebhookKey: {
      type: String,
      required: false,
      default: "",
    },
    shiprocketFulfillmentLockAt: {
      type: Date,
      required: false,
    },
    shiprocketCreateClaimedAt: {
      type: Date,
      required: false,
    },
    shiprocketAwbClaimedAt: {
      type: Date,
      required: false,
    },
    shiprocketPickupClaimedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ shiprocketFulfillmentStatus: 1, updatedAt: -1 });

const Order = mongoose.model(
  "Order",
  orderSchema.plugin(AutoIncrement, {
    inc_field: "invoice",
    start_seq: 10000,
  })
);

module.exports = Order;
