/**
 * Sanitizes data by removing undefined values and converting them to null
 * This is necessary for Next.js getServerSideProps to avoid serialization errors
 * @param {any} data - The data to sanitize
 * @returns {any} - Sanitized data with undefined values converted to null
 */
export const sanitizeData = (data) => {
  if (data === undefined) return null;
  if (data === null) return null;

  // Handle primitive types
  if (typeof data !== "object") return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  // Handle objects
  if (typeof data === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = null;
      }
    }
    return sanitized;
  }

  return data;
};

/**
 * Sanitizes product data specifically for the product detail page
 * @param {Object} product - The product object to sanitize
 * @returns {Object} - Sanitized product object
 */
export const sanitizeProduct = (product) => {
  if (!product) return null;

  // First sanitize all undefined values
  const sanitized = sanitizeData(product);

  // Ensure all required fields exist with fallback values
  return {
    _id: sanitized._id || null,
    title: sanitized.title || { en: "Product Title" },
    description: sanitized.description || { en: "Product Description" },
    highlights: sanitized.highlights || { en: "" },
    slug: sanitized.slug || "",
    image: sanitized.image || [],
    category: sanitized.category || { _id: null, name: { en: "Category" } },
    categories: sanitized.categories || [],
    brand: sanitized.brand || null,
    sku: sanitized.sku || "",
    barcode: sanitized.barcode || "",
    // stock: sanitized.stock || 0,
    // prices: sanitized.prices || { price: 0, originalPrice: 0, discount: 0 },
    isCombination: sanitized.isCombination || false,
    variants: sanitized.variants || [],
    tag: sanitized.tag || [],
    status: sanitized.status || "show",
    ...sanitized,
  };
};

/**
 * Sanitizes an array of products
 * @param {Array} products - Array of products to sanitize
 * @returns {Array} - Array of sanitized products
 */
export const sanitizeProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map((product) => sanitizeProduct(product));
};
