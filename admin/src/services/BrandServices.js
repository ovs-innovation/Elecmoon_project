import requests from "./httpService";

const BrandServices = {
  getAllBrands: async () => {
    try {
      const data = await requests.get("/brand");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // Re-throw so Brands page can show error; avoid opaque crashes.
      throw err;
    }
  },

  getShowingBrands: async () => {
    try {
      const data = await requests.get("/brand/show");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getBrandById: async (id) => {
    return requests.get(`/brand/${id}`);
  },

  addBrand: async (body) => {
    return requests.post("/brand/add", body);
  },

  updateBrand: async (id, body) => {
    return requests.put(`/brand/${id}`, body);
  },

  updateStatus: async (id) => {
    return requests.put(`/brand/status/${id}`);
  },

  deleteBrand: async (id) => {
    return requests.delete(`/brand/${id}`);
  },

  deleteManyBrand: async (body) => {
    return requests.patch("/brand/delete/many", body);
  },
};

export default BrandServices;
