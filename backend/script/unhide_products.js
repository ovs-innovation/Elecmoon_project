const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", productSchema, "products");

async function unhideProducts() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully.");

    const result = await Product.updateMany(
      { status: "hide" },
      { $set: { status: "show" } }
    );

    console.log(`Successfully updated ${result.modifiedCount} hidden products to status 'show'!`);

    const showCount = await Product.countDocuments({ status: "show" });
    const hideCount = await Product.countDocuments({ status: "hide" });
    console.log(`Current DB status count - Show: ${showCount}, Hide: ${hideCount}`);

    process.exit(0);
  } catch (err) {
    console.error("Error unhiding products:", err);
    process.exit(1);
  }
}

unhideProducts();
