import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS } from "./config";

/** Backend endpoints that call the AI service (POST only). */
const AI_ENDPOINTS: RegExp[] = [
  /^\/chat$/,
  /^\/(studyplans|notes|quizzes|flashcards)\/generate$/,
];

/**
 * Normalises a request URL to a lower-case API path without origin, "/api" prefix,
 * query string or trailing slash: "https://localhost:7075/api/Notes/generate?x=1" -> "/notes/generate".
 */
export function toApiPath(url: string | undefined): string {
  if (!url) return "";

  let path = url.split(/[?#]/)[0];
  path = path.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, ""); // strip origin
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/^\/api(?=\/|$)/i, ""); // strip /api prefix
  path = path.replace(/\/+$/, "");

  return path.toLowerCase();
}

/** True for requests that go to an AI endpoint (they need the long timeout). */
export function isAiRequest(method: string | undefined, url: string | undefined): boolean {
  if ((method ?? "get").toLowerCase() !== "post") return false;

  const path = toApiPath(url);
  return AI_ENDPOINTS.some((pattern) => pattern.test(path));
}

/**
 * Gives AI requests the long timeout unless the caller chose a timeout explicitly.
 * Used by the axios request interceptor, so services do not need to remember it.
 */
export function applyAiTimeout(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const usesDefaultTimeout = config.timeout === undefined || config.timeout === DEFAULT_TIMEOUT_MS;

  if (usesDefaultTimeout && isAiRequest(config.method, config.url)) {
    config.timeout = AI_TIMEOUT_MS;
  }

  return config;
}

/** Explicit per-request option, e.g. api.post(url, body, aiRequestConfig). */
export const aiRequestConfig: AxiosRequestConfig = { timeout: AI_TIMEOUT_MS };
