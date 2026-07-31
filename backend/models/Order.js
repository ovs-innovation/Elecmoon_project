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
      enum: ["Shipped", "In Transit", "Delivered"],
      required: false,
    },
    shiprocketOrderId: {
      type: String,
      required: false,
    },
    shiprocketShipmentId: {
      type: String,
      required: false,
    },
    shiprocketStatus: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema.plugin(AutoIncrement, {
    inc_field: "invoice",
    start_seq: 10000,
  })
);
module.exports = Order;
