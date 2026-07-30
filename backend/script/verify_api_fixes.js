const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { languageCodes } = require("../utils/data");
const Product = require("../models/Product");

async function testApiFixes() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB...");

    // Test 1: Search with encoded title "JBD%20BMS"
    const encodedTitle = "JBD%20BMS";
    let decodedTitle = encodedTitle;
    try {
      decodedTitle = decodeURIComponent(encodedTitle);
    } catch(e) {}

    const titleQueries = languageCodes.map((lang) => ({
      [`title.${lang}`]: { $regex: `${decodedTitle}`, $options: "i" },
    }));

    const searchResult = await Product.find({ status: "show", $or: titleQueries });
    console.log(`Test 1 - Search query '${encodedTitle}' (decoded: '${decodedTitle}'): Found ${searchResult.length} matching products.`);

    // Test 2: Category filter with $or
    const sampleProduct = await Product.findOne({ status: "show" });
    const categoryId = sampleProduct.category;

    const categoryResult = await Product.find({
      status: "show",
      $or: [{ category: categoryId }, { categories: categoryId }]
    });
    console.log(`Test 2 - Category query for '${categoryId}': Found ${categoryResult.length} matching products.`);

    console.log("All API queries executed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("API test error:", err);
    process.exit(1);
  }
}

testApiFixes();
