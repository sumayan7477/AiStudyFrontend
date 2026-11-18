import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { applyAiTimeout, toApiPath } from "./aiRequest";
import { notifyUnauthorized } from "./authEvents";
import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from "./config";
import { clearAuthStorage, getToken } from "../utils/token";

/**
 * The single axios instance for the whole app.
 *  - Base URL from VITE_API_BASE_URL (see .env.example)
 *  - 30 s default timeout; AI endpoints automatically get 130 s (see aiRequest.ts)
 *  - Adds "Authorization: Bearer <token>"; no cookies (withCredentials stays false)
 *  - On 401 from a protected endpoint: clears stored credentials and signals logout
 *  - Errors are rejected unchanged (AxiosError); use parseApiError() from ./errors to read them
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Login/register report bad credentials with 401/400 themselves; never treat that as "session expired". */
const AUTH_ENDPOINTS = new Set(["/auth/login", "/auth/register"]);

export function isAuthEndpoint(url: string | undefined): boolean {
  return AUTH_ENDPOINTS.has(toApiPath(url));
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return applyAiTimeout(config);
  },
  (error: AxiosError) => Promise.reject(error),
);

let networkHintShown = false;

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 && !isAuthEndpoint(error.config?.url)) {
      handleUnauthorized();
    }

    if (!error.response && error.code === "ERR_NETWORK" && import.meta.env.DEV && !networkHintShown) {
      networkHintShown = true;
      console.warn(
        `Could not reach ${API_BASE_URL}. Check that the API is running, that its HTTPS ` +
          "development certificate is trusted (dotnet dev-certs https --trust), and that this page " +
          "is served from http://localhost:5173 (the only origin allowed by CORS).",
      );
    }

    return Promise.reject(error);
  },
);

/** Session expired or revoked: clear credentials, then let AuthContext react (F2) or fall back to a redirect. */
function handleUnauthorized(): void {
  clearAuthStorage();

  const handled = notifyUnauthorized();

  if (!handled && typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export default api;
