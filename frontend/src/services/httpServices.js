import axios from "axios";
import {
  handleSessionExpired,
  isSessionExpiredError,
  markAuthErrorHandled,
} from "@lib/authSession";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 50000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isSessionExpiredError(error)) {
      markAuthErrorHandled(error);
      await handleSessionExpired();
    }
    return Promise.reject(error);
  }
);

export const setToken = (token) => {
  if (token) {
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common["Authorization"];
  }
};

const responseBody = (response) => response.data;

const requests = {
  get: (url, body) => instance.get(url, body).then(responseBody),
  post: (url, body, headers) =>
    instance.post(url, body, headers).then(responseBody),
  put: (url, body) => instance.put(url, body).then(responseBody),
  delete: (url, body) => instance.delete(url, { data: body }).then(responseBody),
};

export default requests;
