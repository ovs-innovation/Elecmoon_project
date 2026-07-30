const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { connectDB } = require("../config/db");
const Product = require("../models/Product");

async function checkProduct() {
  await connectDB();
  const id = "6a1e8bb7287d5800139f2090";
  const p = await Product.findById(id);
  console.log("Product found:", p ? { id: p._id, title: p.title, status: p.status, price: p.price } : null);
  process.exit(0);
}

checkProduct();
