const express = require("express");
const router = express.Router();
const {
  addBrand,
  getAllBrands,
  getShowingBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
  updateStatus,
  deleteBrand,
  deleteManyBrand,
} = require("../controller/brandController");
const { isAuth, isAdmin } = require("../config/auth");

const adminOnly = [isAuth, isAdmin];

router.get("/show", getShowingBrands);
router.get("/slug/:slug", getBrandBySlug);

router.get("/", adminOnly, getAllBrands);
router.get("/:id", adminOnly, getBrandById);
router.post("/add", adminOnly, addBrand);
router.put("/:id", adminOnly, updateBrand);
router.put("/status/:id", adminOnly, updateStatus);
router.delete("/:id", adminOnly, deleteBrand);
router.patch("/delete/many", adminOnly, deleteManyBrand);

module.exports = router;
