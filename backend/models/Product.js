const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: false,
    },
    sku: {
      type: String,
      required: false,
    },
    barcode: {
      type: String,
      required: false,
    },
    title: {
      type: Object,
      required: true,
    },
    description: {
      type: Object,
      required: false,
    },
    highlights: {
      type: Object,
      required: false,
    },
    slug: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: false,
      index: true,
    },
    image: {
      type: Array,
      required: false,
    },
    tag: [String],
    variants: [{}],
    isCombination: {
      type: Boolean,
      required: true,
    },

    status: {
      type: String,
      lowercase: true,
      default: "show",
      enum: ["show", "hide"],
    },

    price: {
      type: Number,
      required: false,
    },

    /** MRP / list price before discount (GST inclusive, same as `price`) */
    originalPrice: {
      type: Number,
      required: false,
      default: 0,
    },

    basePrice: {
      type: Number,
      required: false,
      default: 0,
    },

    gstPercentage: {
      type: Number,
      required: false,
      default: 0,
    },


    // Admin-controlled per-product delivery charge.
    // Used during checkout to calculate Delivery Charges.
    deliveryCharge: {
      type: Number,
      required: false,
      default: 0,
    },

    minOrderQuantity: {
      type: Number,
      required: false,
      default: 1,
    },

    /** 0 = no maximum order cap */
    maxOrderQuantity: {
      type: Number,
      required: false,
      default: 0,
    },

    /** Bulk pricing: min/max qty per tier, discount % or fixed unit price (GST inclusive) */
    quantityTiers: [
      {
        minQuantity: { type: Number, default: 1 },
        maxQuantity: { type: Number, default: 0 },
        discountPercent: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
      },
    ],

    type: {
      type: String,
      default: "normal",
      enum: ["normal", "popular", "trending", "new"],
    },

    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: false,
      },
    ],
    videoUrl: {
      type: String,
      required: false,
    },

    /** GST HSN code (4–8 digit numeric or alphanumeric) */
    hsnCode: {
      type: String,
      required: false,
      trim: true,
    },

    /** When false, stock is not enforced (legacy/untracked products stay purchasable) */
    trackInventory: {
      type: Boolean,
      required: false,
      default: false,
    },

    /** Available inventory units */
    stock: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },

    /** Alert when stock falls to or below this level */
    lowStockThreshold: {
      type: Number,
      required: false,
      default: 5,
      min: 0,
    },

    /** Cloudinary URL for product datasheet PDF */
    datasheetUrl: {
      type: String,
      required: false,
    },

    /** Package dimensions for Shiprocket (cm / kg). Optional — env defaults used if missing. */
    length: {
      type: Number,
      required: false,
      min: 0,
    },
    breadth: {
      type: Number,
      required: false,
      min: 0,
    },
    height: {
      type: Number,
      required: false,
      min: 0,
    },
    weight: {
      type: Number,
      required: false,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// module.exports = productSchema;

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
