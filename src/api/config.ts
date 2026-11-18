/**
 * API client settings. Kept separate from axios.ts so helpers can import them
 * without importing the axios instance (no circular imports).
 */

/** Default timeout for normal API calls. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Timeout for AI endpoints (chat and the ".../generate" routes). The backend allows 60 s per Gemini
 * attempt plus one retry, so a slow request can take about 2 minutes.
 */
export const AI_TIMEOUT_MS = 130_000;

const FALLBACK_BASE_URL = "https://localhost:7075/api";

function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configured) {
    console.warn(
      `VITE_API_BASE_URL is not set; falling back to ${FALLBACK_BASE_URL}. ` +
        "Copy .env.example to .env to configure it.",
    );
    return FALLBACK_BASE_URL;
  }

  return configured.replace(/\/+$/, "");
}

/** Backend base URL including the /api prefix, without a trailing slash. */
export const API_BASE_URL = resolveBaseUrl();
