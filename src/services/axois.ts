import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getToken, removeToken } from "../utils/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================
// Request Interceptor
// ========================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ========================
// Response Interceptor
// ========================
api.interceptors.response.use(
  (response: AxiosResponse) => response,

  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();

      // Redirect to login
      window.location.href = "/login";
    }

    if (error.response?.status === 403) {
      console.error("Access denied");
    }

    if (error.response?.status === 500) {
      console.error("Server error");
    }

    return Promise.reject(error);
  }
);

export default api;