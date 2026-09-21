const Brand = require("../models/Brand");

const slugify = (text = "") =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const addBrand = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).send({ message: "Brand name is required" });
    }
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);
    const brand = new Brand({
      name,
      slug,
      logo: req.body.logo || "",
      description: req.body.description || "",
      status: req.body.status || "show",
    });
    await brand.save();
    res.send({ message: "Brand added successfully!", data: brand });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });
    res.send(brands);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getShowingBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ status: "show" }).sort({ name: 1 });
    res.send(brands);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).send({ message: "Brand not found" });
    res.send(brand);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getBrandBySlug = async (req, res) => {
  try {
    const brand = await Brand.findOne({
      slug: req.params.slug,
      status: "show",
    });
    if (!brand) return res.status(404).send({ message: "Brand not found" });
    res.send(brand);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).send({ message: "Brand not found" });

    if (req.body.name) brand.name = String(req.body.name).trim();
    if (req.body.slug || req.body.name) {
      brand.slug = slugify(req.body.slug || req.body.name || brand.name);
    }
    if (req.body.logo !== undefined) brand.logo = req.body.logo || "";
    if (req.body.description !== undefined) {
      brand.description = req.body.description || "";
    }
    if (req.body.status) brand.status = req.body.status;

    await brand.save();
    res.send({ message: "Brand updated successfully!", data: brand });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).send({ message: "Brand not found" });
    brand.status = brand.status === "show" ? "hide" : "show";
    await brand.save();
    res.send({
      message: `Brand is now ${brand.status}`,
      status: brand.status,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    await Brand.deleteOne({ _id: req.params.id });
    res.send({ message: "Brand deleted successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteManyBrand = async (req, res) => {
  try {
    await Brand.deleteMany({ _id: { $in: req.body.ids || [] } });
    res.send({ message: "Brands deleted successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  addBrand,
  getAllBrands,
  getShowingBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
  updateStatus,
  deleteBrand,
  deleteManyBrand,
};
