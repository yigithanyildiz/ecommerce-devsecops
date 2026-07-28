import axios from "axios";

const TOKEN_KEY = "admin_access_token";
const USER_KEY = "admin_user";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
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
