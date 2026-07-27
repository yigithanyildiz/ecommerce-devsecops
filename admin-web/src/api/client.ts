import axios from "axios";

const TOKEN_KEY = "admin_access_token";
const USER_KEY = "admin_user";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    if (status === 401 && currentPath !== "/login") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.assign("/login");
    }

    if (status === 403 && currentPath !== "/unauthorized") {
      window.location.assign("/unauthorized");
    }

    return Promise.reject(error);
  },
);
