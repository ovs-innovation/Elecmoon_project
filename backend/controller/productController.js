const Product = require("../models/Product");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const { languageCodes } = require("../utils/data");
const { validateHsnCode } = require("../lib/stock/inventory");

const addProduct = async (req, res) => {
  try {
    const hsnCheck = validateHsnCode(req.body.hsnCode);
    if (!hsnCheck.valid) {
      return res.status(400).send({ message: hsnCheck.message });
    }

    const status = req.body.status || req.body.show || "show";
    const gstPercentage = Number(req.body.gstPercentage || 0);
    const price = Number(req.body.price || 0);
    const basePrice = gstPercentage > 0 ? price / (1 + gstPercentage / 100) : price;

    const newProduct = new Product({
      ...req.body,
      hsnCode: hsnCheck.value,
      status: status,
      basePrice: basePrice,
      productId: req.body.productId
        ? req.body.productId
        : mongoose.Types.ObjectId(),
    });

    await newProduct.save();
    res.send(newProduct);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const addAllProducts = async (req, res) => {
  try {
    await Product.deleteMany();
    await Product.insertMany(req.body);
    res.status(200).send({
      message: "Product Added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "show" }).sort({ _id: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  const { title, category, price, page, limit } = req.query;
  let queryObject = {};
  let sortObject = { _id: -1 };
  const andConditions = [];

  if (title) {
    let decodedTitle = title;
    try {
      decodedTitle = decodeURIComponent(title);
    } catch (e) {}
    const titleQueries = languageCodes.map((lang) => ({
      [`title.${lang}`]: { $regex: `${decodedTitle}`, $options: "i" },
    }));
    andConditions.push({ $or: titleQueries });
  }

  if (category) {
    andConditions.push({
      $or: [{ category: category }, { categories: category }],
    });
  }

  if (andConditions.length > 0) {
    queryObject.$and = andConditions;
  }

  const pages = Number(page);
  const limits = Number(limit);
  const skip = (pages - 1) * limits;

  try {
    const totalDoc = await Product.countDocuments(queryObject);

    const products = await Product.find(queryObject)
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .sort(sortObject)
      .skip(skip)
      .limit(limits);

    res.send({
      products,
      totalDoc,
      limits,
      pages,
    });
  } catch (err) {
    // console.log("error", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductBySlug = async (req, res) => {
  // console.log("slug", req.params.slug);
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: "show" })
      .populate({ path: "category", select: "_id name slug" })
      .populate({ path: "categories", select: "_id name slug" })
      .populate({ path: "brand", select: "_id name slug" });
    // Return null if not found or unpublished — frontend will redirect gracefully
    res.send(product || null);
  } catch (err) {
    res.status(500).send({
      message: `Slug problem, ${err.message}`,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id })
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .populate({ path: "brand", select: "_id name slug" });

    // Return null if not found — frontend will redirect gracefully
    res.send(product || null);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const hsnCheck = validateHsnCode(req.body.hsnCode);
    if (!hsnCheck.valid) {
      return res.status(400).send({ message: hsnCheck.message });
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      product.title = { ...product.title, ...req.body.title };
      product.description = {
        ...product.description,
        ...req.body.description,
      };
      product.highlights = {
        ...product.highlights,
        ...req.body.highlights,
      };

      product.productId = req.body.productId;
      product.sku = req.body.sku;
      product.barcode = req.body.barcode;
      product.slug = req.body.slug;
      product.categories = req.body.categories;
      product.category = req.body.category;
      product.brand = req.body.brand || null;
      product.status = req.body.status || req.body.show;
      product.isCombination = req.body.isCombination;
      product.variants = req.body.variants;
      product.image = req.body.image;
      product.tag = req.body.tag;
      product.videoUrl = req.body.videoUrl;
      product.gstPercentage = Number(req.body.gstPercentage || 0);
      product.hsnCode = hsnCheck.value;
      product.trackInventory = Boolean(req.body.trackInventory);
      product.stock = Math.max(0, parseInt(req.body.stock, 10) || 0);
      product.lowStockThreshold = (() => {
        const threshold = parseInt(req.body.lowStockThreshold, 10);
        return Number.isFinite(threshold)
          ? Math.max(0, threshold)
          : product.lowStockThreshold ?? 5;
      })();
      product.datasheetUrl = req.body.datasheetUrl || "";
      product.minOrderQuantity = Math.max(
        1,
        parseInt(req.body.minOrderQuantity, 10) || 1
      );
      product.maxOrderQuantity = Math.max(
        0,
        parseInt(req.body.maxOrderQuantity, 10) || 0
      );
      product.quantityTiers = Array.isArray(req.body.quantityTiers)
        ? req.body.quantityTiers
        : product.quantityTiers;
      product.deliveryCharge = Number(req.body.deliveryCharge || 0);
      product.originalPrice = Number(req.body.originalPrice) || 0;

      // Recalculate basePrice if price and gstPercentage are present
      const currentPrice = Number(req.body.price || product.price || 0);
      const currentGst = Number(req.body.gstPercentage || product.gstPercentage || 0);
      product.basePrice = currentGst > 0 ? currentPrice / (1 + currentGst / 100) : currentPrice;
      product.price = currentPrice;

      // Handle variant updates with new structure
      if (req.body.variants && Array.isArray(req.body.variants)) {
        product.variants = req.body.variants.map((variant) => {
          // Ensure backward compatibility with old image field
          if (variant.images && variant.images.length > 0 && !variant.image) {
            variant.image = variant.images;
          }
          // If variant.image is a string (old format), convert to array
          if (typeof variant.image === "string") {
            variant.image = [variant.image];
          }
          return variant;
        });
      }

      await product.save();
      res.send({ data: product, message: "Product updated successfully!" });
    } else {
      res.status(404).send({
        message: "Product Not Found!",
      });
    }
  } catch (err) {
    res.status(404).send(err.message);
  }
};

const updateManyProducts = async (req, res) => {
  try {
    const updatedData = {};
    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] !== "[]" &&
        Object.entries(req.body[key]).length > 0 &&
        req.body[key] !== req.body.ids
      ) {
        updatedData[key] = req.body[key];
      }
    }

    await Product.updateMany(
      { _id: { $in: req.body.ids } },
      {
        $set: updatedData,
      },
      {
        multi: true,
      }
    );
    res.send({
      message: "Products update successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatus = (req, res) => {
  const newStatus = req.body.status;
  Product.updateOne(
    { _id: req.params.id },
    {
      $set: {
        status: newStatus,
      },
    },
    (err) => {
      if (err) {
        res.status(500).send({
          message: err.message,
        });
      } else {
        res.status(200).send({
          message: `Product ${newStatus} Successfully!`,
        });
      }
    }
  );
};

const deleteProduct = (req, res) => {
  Product.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: "Product Deleted Successfully!",
      });
    }
  });
};

const getShowingStoreProducts = async (req, res) => {
  try {
    const { category, slug, variantSlug, title, page, limit, brand } = req.query;
    let queryObject = { status: "show" };
    const andConditions = [];

    if (category) {
      andConditions.push({
        $or: [{ category: category }, { categories: category }],
      });
    }

    if (brand) {
      andConditions.push({ brand: brand });
    }

    if (title) {
      let decodedTitle = title;
      try {
        decodedTitle = decodeURIComponent(title);
      } catch (e) {}
      const titleQueries = languageCodes.map((lang) => ({
        [`title.${lang}`]: { $regex: `${decodedTitle}`, $options: "i" },
      }));
      andConditions.push({ $or: titleQueries });
    }

    if (andConditions.length > 0) {
      queryObject.$and = andConditions;
    }

    // If slug is provided, search by main product slug
    if (slug && !variantSlug) {
      queryObject.slug = slug;
    }

    const pages = Number(page) || 1;
    const limits = Number(limit) || 60;
    const skip = (pages - 1) * limits;

    const shouldPaginateList = Boolean(
      (category || title || brand) && !slug && !variantSlug
    );

    const baseQuery = Product.find(queryObject)
      .select(
        "_id title slug image price originalPrice basePrice gstPercentage minOrderQuantity maxOrderQuantity quantityTiers deliveryCharge trackInventory stock lowStockThreshold hsnCode datasheetUrl category categories variants videoUrl createdAt"
      )
      .populate({ path: "categories", select: "_id name slug" })
      .populate({ path: "category", select: "_id name slug" })
      .populate({ path: "services", select: "_id name slug" })
      .sort({ _id: -1 })
      .lean();

    // For category/search listing: return small payload + pagination
    if (shouldPaginateList) {
      const [totalDoc, products] = await Promise.all([
        Product.countDocuments(queryObject),
        baseQuery.skip(skip).limit(limits),
      ]);

      return res.send({
        products,
        totalDoc,
        limits,
        pages,
      });
    }

    const products = await baseQuery;

    // If variantSlug is provided, search through all products to find the one with this variant
    if (variantSlug) {
      let foundProduct = null;
      let foundVariant = null;

      // Search through all products to find the one containing this variant slug
      for (const product of products) {
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find((v) => v.slug === variantSlug);
          if (variant) {
            foundProduct = product;
            foundVariant = variant;
            break;
          }
        }
      }

      // If we found the product and variant, return it
      if (foundProduct && foundVariant) {
        // Ensure variant.image is always an array for consistency
        if (typeof foundVariant.image === "string") {
          foundVariant.image = [foundVariant.image];
        }

        // Return product with the specific variant highlighted
        return res.send({
          product: {
            ...foundProduct.toObject(),
            selectedVariant: foundVariant,
          },
          variants: foundProduct.variants,
        });
      }
    }

    // For home page, return structured data
    if (!slug && !variantSlug) {
      // Get popular products (all products for now)
      const popularProducts = products;

      // Get discounted products (products with any discount)
      const discountedProducts = products.filter((product) => {
        // Check if prodct tag
        return (
          product.variants &&
          product.variants.some(
            (variant) => variant.discount && variant.discount > 0
          )
        );
      });

      // Get new arrivals products (products created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newArrivalsProducts = products.filter((product) => {
        return new Date(product.createdAt) >= thirtyDaysAgo;
      });

      return res.send({
        popularProducts,
        discountedProducts,
        newArrivalsProducts,
        products,
      });
    }

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteManyProducts = async (req, res) => {
  try {
    const cname = req.cname;

    await Product.deleteMany({ _id: req.body.ids });

    res.send({
      message: `Products Delete Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductsByTag = async (req, res) => {
  try {
    const { tag } = req.query;
    let queryObject = { status: "show" };

    if (tag) {
      queryObject.tag = { $in: [tag] };
    }

    const products = await Product.find(queryObject)
      .populate("categories")
      .populate("category")
      .populate("services")
      .sort({ _id: -1 });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductsByService = async (req, res) => {
  try {
    const { serviceSlug, serviceId } = req.query;
    let queryObject = { status: "show" };

    if (serviceId) {
      // Filter by service ObjectId directly
      queryObject.services = serviceId;
    } else if (serviceSlug) {
      // Find the service by slug first
      const Service = require("../models/Service");
      const service = await Service.findOne({ slug: serviceSlug });
      if (!service) {
        return res.status(404).send({ message: "Service not found" });
      }
      queryObject.services = service._id;
    }

    const products = await Product.find(queryObject)
      .populate("categories")
      .populate("category")
      .populate("services")
      .sort({ _id: -1 });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductsByType = async (req, res) => {
  try {
    const { type } = req.query;
    let queryObject = { status: "show" };

    if (type) {
      queryObject.type = type;
    }

    const products = await Product.find(queryObject)
      .populate("categories")
      .populate("category")
      .sort({ _id: -1 });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateManyProducts,
  updateStatus,
  deleteProduct,
  deleteManyProducts,
  getShowingStoreProducts,
  getProductsByTag,
  getProductsByType,
  getProductsByService,
};
