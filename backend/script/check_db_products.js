const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", productSchema, "products");

async function checkProducts() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully.");

    const totalProducts = await Product.countDocuments();
    console.log("Total Products in DB:", totalProducts);

    const statusCounts = await Product.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    console.log("Status distribution:", JSON.stringify(statusCounts, null, 2));

    const showProducts = await Product.find({ status: "show" }).lean();
    console.log("Count of products with status 'show':", showProducts.length);

    const hiddenProducts = await Product.find({ status: "hide" }).lean();
    console.log("Count of products with status 'hide':", hiddenProducts.length);
    console.log("\nHidden products list:");
    hiddenProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. [${p._id}] Title: ${JSON.stringify(p.title)} | Slug: ${p.slug}`);
    });

    let brokenCloudinaryImages = [];
    let allProducts = await Product.find({}).lean();
    allProducts.forEach((p) => {
      const imgs = Array.isArray(p.image) ? p.image : [p.image];
      imgs.forEach((imgUrl) => {
        if (typeof imgUrl === "string" && imgUrl.includes("cloudinary")) {
          if (imgUrl.includes("dhqcwkpzp")) {
            brokenCloudinaryImages.push({ id: p._id, title: p.title?.en || p.title, url: imgUrl });
          }
        }
      });
    });
    console.log(`\nFound ${brokenCloudinaryImages.length} images using old/disabled Cloudinary account (dhqcwkpzp):`);
    brokenCloudinaryImages.slice(0, 10).forEach(item => console.log(` - Product ${item.id} (${item.title}): ${item.url}`));

    // Check category vs categories field inconsistency
    let categoryMismatchCount = 0;
    allProducts.forEach((p) => {
      const catId = p.category ? p.category.toString() : null;
      const catsArray = Array.isArray(p.categories) ? p.categories.map(c => c ? c.toString() : "") : [];
      if (catId && !catsArray.includes(catId)) {
        categoryMismatchCount++;
      }
    });
    console.log(`\nProducts where 'category' ID is NOT inside 'categories' array: ${categoryMismatchCount}`);

    process.exit(0);
  } catch (err) {
    console.error("Error in check script:", err);
    process.exit(1);
  }
}

checkProducts();
