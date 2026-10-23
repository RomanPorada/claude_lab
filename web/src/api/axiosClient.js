import axios from "axios";

// У проді фронтенд віддається тим самим сервером, тому відносні URL.
// Для локальної розробки див. .env.development
const API_BASE = process.env.REACT_APP_API_URL ?? "";

export const TOKEN_KEY = "auth_token";

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Токен прострочений/недійсний — виходимо з акаунта
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    if (err.response?.status === 401 && !url.startsWith("/auth/")) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("redux_user");
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
