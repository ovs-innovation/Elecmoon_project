const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      required: false,
      default: "",
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    status: {
      type: String,
      lowercase: true,
      enum: ["show", "hide"],
      default: "show",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
