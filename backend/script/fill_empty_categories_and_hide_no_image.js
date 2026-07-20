require("dotenv").config();
const { connectDB } = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");

const SKIP_CATEGORY_NAMES = new Set([
  "home",
  "all categories",
  "all departments",
]);

const PRODUCTS_PER_EMPTY_CATEGORY = 4;

const getName = (name) => {
  if (!name) return "";
  if (typeof name === "string") return name.trim();
  return (name.en || Object.values(name).find(Boolean) || "").trim();
};

const isValidImageUrl = (url) => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/placeholder/i.test(trimmed)) return false;
  return true;
};

const productHasImage = (product) => {
  if (Array.isArray(product.image) && product.image.some(isValidImageUrl)) {
    return true;
  }
  if (Array.isArray(product.variants)) {
    return product.variants.some(
      (variant) =>
        Array.isArray(variant?.image) && variant.image.some(isValidImageUrl)
    );
  }
  return false;
};

const productLinkedToCategory = (product, categoryId) => {
  const target = String(categoryId);
  if (String(product.category) === target) return true;
  return (product.categories || []).some((id) => String(id) === target);
};

const countShowingInCategory = (products, categoryId) => {
  const target = String(categoryId);
  return products.filter(
    (product) =>
      product.status === "show" &&
      productHasImage(product) &&
      productLinkedToCategory(product, target)
  ).length;
};

const main = async () => {
  await connectDB();

  const [categories, products] = await Promise.all([
    Category.find({ status: "show" }).lean(),
    Product.find({}).lean(),
  ]);

  const shopCategories = categories.filter((category) => {
    const name = getName(category.name).toLowerCase();
    return name && !SKIP_CATEGORY_NAMES.has(name);
  });

  const showingWithImage = products.filter(
    (product) => product.status === "show" && productHasImage(product)
  );

  const showingNoImage = products.filter(
    (product) => product.status === "show" && !productHasImage(product)
  );

  console.log("=== Fill empty categories + hide products without images ===\n");
  console.log(`Shop categories: ${shopCategories.length}`);
  console.log(`Showing products with image (pool): ${showingWithImage.length}`);
  console.log(`Showing products without image (to hide): ${showingNoImage.length}\n`);

  // 1) Hide products without pictures
  let hiddenCount = 0;
  for (const product of showingNoImage) {
    const result = await Product.updateOne(
      { _id: product._id, status: "show" },
      { $set: { status: "hide" } }
    );
    if (result.modifiedCount) {
      hiddenCount += 1;
      console.log(`HIDDEN (no image): ${getName(product.title) || product.slug}`);
    }
  }
  console.log(`\n✅ Unpublished ${hiddenCount} products without images\n`);

  // Refresh pool after hiding (in case any were in pool - they shouldn't be)
  const refreshedProducts = await Product.find({ status: "show" }).lean();
  const imagePool = refreshedProducts.filter((product) =>
    productHasImage(product)
  );

  if (!imagePool.length) {
    console.log("No image pool available for category fill.");
    process.exit(0);
  }

  // 2) Fill empty categories
  let poolIndex = 0;
  let categoryLinksAdded = 0;

  const emptyCategories = shopCategories.filter(
    (category) =>
      countShowingInCategory(refreshedProducts, category._id) <
      PRODUCTS_PER_EMPTY_CATEGORY
  );

  console.log(`Empty categories to fill: ${emptyCategories.length}\n`);

  for (const category of emptyCategories) {
    const categoryId = category._id;
    const needed =
      PRODUCTS_PER_EMPTY_CATEGORY -
      countShowingInCategory(refreshedProducts, categoryId);

    const picked = [];
    let attempts = 0;
    const maxAttempts = imagePool.length * 2;

    while (picked.length < needed && attempts < maxAttempts) {
      const candidate = imagePool[poolIndex % imagePool.length];
      poolIndex += 1;
      attempts += 1;

      if (picked.some((item) => String(item._id) === String(candidate._id))) {
        continue;
      }

      // Only skip if already linked AND visible in this category
      const alreadyVisible =
        candidate.status === "show" &&
        productLinkedToCategory(candidate, categoryId);
      if (alreadyVisible) continue;

      picked.push(candidate);
    }

    if (!picked.length) {
      console.log(`⚠️  No products available for: ${getName(category.name)}`);
      continue;
    }

    console.log(`Category: ${getName(category.name)} (${category.slug || categoryId})`);

    for (const product of picked) {
      const result = await Product.updateOne(
        { _id: product._id },
        { $addToSet: { categories: categoryId } }
      );

      if (result.modifiedCount) {
        categoryLinksAdded += 1;
        console.log(`  + linked: ${getName(product.title) || product.slug}`);
      } else {
        console.log(`  · already linked: ${getName(product.title) || product.slug}`);
      }
    }
  }

  // 3) Verification
  const finalProducts = await Product.find({ status: "show" }).lean();
  const stillEmpty = shopCategories.filter(
    (category) => countShowingInCategory(finalProducts, category._id) === 0
  );
  const stillShowingNoImage = finalProducts.filter(
    (product) => !productHasImage(product)
  );

  console.log("\n=== Summary ===");
  console.log(`Products unpublished (no image): ${hiddenCount}`);
  console.log(`Category links added: ${categoryLinksAdded}`);
  console.log(`Categories still empty: ${stillEmpty.length}`);
  if (stillEmpty.length) {
    stillEmpty.forEach((category) =>
      console.log(`  - ${getName(category.name)}`)
    );
  }
  console.log(`Showing products still without image: ${stillShowingNoImage.length}`);

  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
