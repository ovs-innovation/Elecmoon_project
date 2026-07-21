import requests from "./httpServices";

const CustomerServices = {
  loginCustomer: async (body) => {
    return requests.post("/customer/login", body);
  },

  sendLoginOtp: async (body) => {
    return requests.post("/customer/login/otp/send", body);
  },

  verifyLoginOtp: async (body) => {
    return requests.post("/customer/login/otp/verify", body);
  },

  sendSignupOtp: async (body) => {
    return requests.post("/customer/signup/otp/send", body);
  },

  verifySignupOtp: async (body) => {
    return requests.post("/customer/signup/otp/verify", body);
  },

  verifyEmailAddress: async (body) => {
    return requests.post("/customer/verify-email", body);
  },
  verifyPhoneNumber: async (body) => {
    return requests.post("/customer/verify-phone", body);
  },

  registerCustomer: async (token, body) => {
    return requests.post(`/customer/register/${token}`, body);
  },

  signUpWithOauthProvider: async (body) => {
    return requests.post(`/customer/signup/oauth`, body);
  },

  signUpWithProvider(token, body) {
    return requests.post(`/customer/signup/${token}`, body);
  },

  forgetPassword: async (body) => {
    return requests.put("/customer/forget-password", body);
  },

  resetPassword: async (body) => {
    return requests.put("/customer/reset-password", body);
  },

  changePassword: async (body) => {
    return requests.post("/customer/change-password", body);
  },

  updateCustomer: async (id, body) => {
    return requests.put(`/customer/${id}`, body);
  },

  getShippingAddress: async ({ userId = "" }) => {
    return requests.get(`/customer/shipping/address/${userId}`);
  },

  addShippingAddress: async ({ userId = "", shippingAddressData }) => {
    return requests.post(
      `customer/shipping/address/${userId}`,
      shippingAddressData
    );
  },

  getCart: async (id) => {
    return requests.get(`/customer/cart/${id}`);
  },

  saveCart: async (id, body) => {
    return requests.put(`/customer/cart/${id}`, body);
  },

  getWishlist: async (id) => {
    return requests.get(`/customer/wishlist/${id}`);
  },

  saveWishlist: async (id, body) => {
    return requests.put(`/customer/wishlist/${id}`, body);
  },
};

export default CustomerServices;
