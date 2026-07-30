const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { connectDB } = require("../config/db");
const { calculateOrderTotals } = require("../lib/order/calculateOrderTotals");

async function debugCalc() {
  await connectDB();
  const cart = [
    {
      _id: "6a1e8bb7287d5800139f2090",
      id: "6a1e8bb7287d5800139f2090",
      title: "Elecmoon Original JBD BMS LFP 4S 100A",
      price: 1854.96,
      quantity: 1,
      itemTotal: 1854.96
    }
  ];

  try {
    const res = await calculateOrderTotals({ cart, shippingOption: "Product Delivery" });
    console.log("Calc Result:", res);
  } catch (err) {
    console.log("Calc Threw Error:", err.message);
  }
  process.exit(0);
}

debugCalc();
