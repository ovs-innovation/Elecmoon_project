import requests from "./httpServices";

const safeArray = async (fn) => {
  try {
    const data = await fn();
    return Array.isArray(data) ? data : [];
  } catch {
    // Brand API may be missing on older deployments — never break the storefront.
    return [];
  }
};

const BrandServices = {
  getShowingBrands: async () => safeArray(() => requests.get("/brand/show")),

  getBrandBySlug: async (slug) => {
    try {
      return await requests.get(`/brand/slug/${encodeURIComponent(slug)}`);
    } catch {
      return null;
    }
  },
};

export default BrandServices;
