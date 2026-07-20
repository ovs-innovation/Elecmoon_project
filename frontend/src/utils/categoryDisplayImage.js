import { getProductImageSrc, hasProductImage } from "@utils/productImage";
import { IMAGE_PLACEHOLDER } from "@utils/cloudinaryImage";

const getProductCategoryIds = (product) => {
  const ids = new Set();
  if (!product) return [];

  const primary = product?.category?._id || product?.category;
  if (primary) ids.add(String(primary));

  if (Array.isArray(product?.categories)) {
    product.categories.forEach((cat) => {
      const id = cat?._id || cat;
      if (id) ids.add(String(id));
    });
  }

  return [...ids];
};

/** Build categoryId -> optimized product image URL from a product list */
export const buildCategoryPreviewImages = (products = [], { width = 480 } = {}) => {
  const map = {};

  for (const product of products) {
    if (!hasProductImage(product)) continue;

    const imageSrc = getProductImageSrc(product, 0, { width });
    if (!imageSrc || imageSrc === IMAGE_PLACEHOLDER) continue;

    for (const catId of getProductCategoryIds(product)) {
      if (!map[catId]) map[catId] = imageSrc;
    }
  }

  return map;
};

/** Product image from DB first, then category icon */
export const getCategoryCardImage = (category, previewImages = {}) => {
  const catId = category?._id ? String(category._id) : "";
  const productImage = catId ? previewImages[catId] : null;
  if (productImage) return productImage;
  return category?.icon || null;
};

export const getFeaturedProductImage = (products = [], { width = 600 } = {}) => {
  const withImage = products.find((p) => hasProductImage(p));
  if (!withImage) return null;
  const src = getProductImageSrc(withImage, 0, { width });
  return src === IMAGE_PLACEHOLDER ? null : src;
};
