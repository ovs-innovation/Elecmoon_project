import requests from "./httpServices";

const ProductServices = {
  getShowingProducts: async () => {
    return requests.get("/products/show");
  },
  getShowingStoreProducts: async ({
    category = "",
    title = "",
    slug = "",
    variantSlug = "",
    page = "",
    limit = "",
    brand = "",
  }) => {
    return requests.get(
      `/products/store?category=${category}&title=${title}&slug=${slug}&variantSlug=${variantSlug}&page=${page}&limit=${limit}&brand=${brand}`
    );
  },
  getProductsByTag: async (tag) => {
    return requests.get(`/products/tag?tag=${tag}`);
  },
  getDiscountedProducts: async () => {
    return requests.get("/products/discount");
  },

  getProductsByType: async (type) => {
    return requests.get(`/products/type?type=${type}`);
  },

  getProductBySlug: async (slug) => {
    return requests.get(`/products/product/${slug}`);
  },
  getProductsByService: async ({ serviceSlug, serviceId } = {}) => {
    const params = [];
    if (serviceSlug) params.push(`serviceSlug=${serviceSlug}`);
    if (serviceId) params.push(`serviceId=${serviceId}`);
    return requests.get(`/products/service${params.length ? '?' + params.join('&') : ''}`);
  },
};

export default ProductServices;
