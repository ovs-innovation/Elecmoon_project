import requests from "./httpServices";

const OrderServices = {
  addOrder: async (body, headers) => {
    return requests.post("/order/add", body, headers);
  },

  createPhonePePayment: async (body) => {
    return requests.post("/order/create-phonepe-payment", body);
  },

  verifyPhonePePayment: async (body) => {
    return requests.post("/order/verify/phonepe", body);
  },

  getOrderCustomer: async ({ page = 1, limit = 8 }) => {
    return requests.get(`/order?limit=${limit}&page=${page}`);
  },

  getOrderById: async (id, body) => {
    return requests.get(`/order/${id}`, body);
  },

  sendEmailInvoiceToCustomer: async (body) => {
    return requests.post("/order/customer/invoice", body);
  },
};

export default OrderServices;
