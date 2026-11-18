import axios from "axios";
import { isAiRequest } from "./aiRequest";

/**
 * One normalised shape for every failed API call, so pages never have to inspect
 * axios internals. Usage:
 *
 *   try { await api.post(...) }
 *   catch (e) {
 *     const err = parseApiError(e);
 *     toast.error(err.message);
 *     setFieldErrors(err.fieldErrors);           // validation (400)
 *     if (err.retryAfterSeconds) ...             // 429
 *   }
 */
export type ApiErrorKind =
  | "validation" // 400 with field errors
  | "badRequest" // 400 without field errors (e.g. invalid quiz submission)
  | "unauthorized" // 401
  | "forbidden" // 403
  | "notFound" // 404
  | "contentBlocked" // 422 (AI safety filters)
  | "rateLimited" // 429
  | "timeout" // client timeout, 408, 504
  | "network" // no response: API down, untrusted HTTPS certificate, CORS, offline
  | "cancelled" // request aborted by the app
  | "server" // 5xx
  | "unknown";

export interface ApiError {
  kind: ApiErrorKind;
  /** HTTP status, or null when no response was received. */
  status: number | null;
  /** User-facing message (from the server when available). */
  message: string;
  /** Validation errors keyed by camelCase field name, e.g. { password: ["..."] }. */
  fieldErrors: Record<string, string[]>;
  /** Seconds to wait before retrying (429 Retry-After), when provided. */
  retryAfterSeconds: number | null;
  /** Server trace id for support/log correlation, when provided. */
  traceId: string | null;
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  validation: "Please correct the highlighted fields.",
  badRequest: "The request could not be processed.",
  unauthorized: "Your session has expired. Please log in again.",
  forbidden: "You do not have permission to perform this action.",
  notFound: "The requested item was not found.",
  contentBlocked: "The request was blocked by the AI safety filters. Please rephrase it.",
  rateLimited: "Too many requests. Please wait a moment and try again.",
  timeout: "The request timed out. Please try again.",
  network: "Unable to reach the server. Please check your connection and try again.",
  cancelled: "The request was cancelled.",
  server: "Something went wrong on the server. Please try again later.",
  unknown: "Something went wrong. Please try again.",
};

const AI_TIMEOUT_MESSAGE = "The AI is taking longer than expected. Please try again.";

export function parseApiError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return build("cancelled", null);
  }

  if (!axios.isAxiosError(error)) {
    return build("unknown", null);
  }

  const response = error.response;

  // No response at all: timeout, network failure, CORS rejection or untrusted certificate.
  if (!response) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      const message = isAiRequest(error.config?.method, error.config?.url)
        ? AI_TIMEOUT_MESSAGE
        : DEFAULT_MESSAGES.timeout;
      return build("timeout", null, message);
    }

    if (error.code === "ERR_CANCELED") {
      return build("cancelled", null);
    }

    return build("network", null);
  }

  const status = response.status;
  const data: unknown = response.data;
  const serverMessage = extractMessage(data);
  const fieldErrors = extractFieldErrors(data);
  const kind = kindForStatus(status, fieldErrors);

  return {
    kind,
    status,
    message: serverMessage ?? DEFAULT_MESSAGES[kind],
    fieldErrors,
    retryAfterSeconds: status === 429 || status === 503 ? parseRetryAfter(headerValue(response.headers, "retry-after")) : null,
    traceId: isRecord(data) && typeof data.traceId === "string" ? data.traceId : null,
  };
}

/** Convenience: the user-facing message for any error. */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const parsed = parseApiError(error);
  return parsed.kind === "unknown" && fallback ? fallback : parsed.message;
}

/** Message for display, with the retry delay appended for rate-limited requests. */
export function formatApiError(error: ApiError): string {
  if (error.retryAfterSeconds && error.retryAfterSeconds > 0) {
    return `${error.message} (Try again in ${error.retryAfterSeconds} s.)`;
  }

  return error.message;
}

/** Convenience: validation errors keyed by camelCase field name (empty object if none). */
export function getFieldErrors(error: unknown): Record<string, string[]> {
  return parseApiError(error).fieldErrors;
}

// ---------------------------------------------------------------- helpers

function build(kind: ApiErrorKind, status: number | null, message?: string): ApiError {
  return {
    kind,
    status,
    message: message ?? DEFAULT_MESSAGES[kind],
    fieldErrors: {},
    retryAfterSeconds: null,
    traceId: null,
  };
}

function kindForStatus(status: number, fieldErrors: Record<string, string[]>): ApiErrorKind {
  if (status === 400) return Object.keys(fieldErrors).length > 0 ? "validation" : "badRequest";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 408 || status === 504) return "timeout";
  if (status === 422) return "contentBlocked";
  if (status === 429) return "rateLimited";
  if (status >= 500) return "server";
  return "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Supports the ApiResponse body and older plain-string error bodies. */
function extractMessage(data: unknown): string | null {
  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) {
    return data.trim();
  }

  if (isRecord(data) && typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  return null;
}

/**
 * Reads ApiResponse.errors ({ Field: [messages] }) and normalises keys to camelCase
 * ("Password" -> "password", "$.examDate" -> "examDate", "Answers[0].SelectedAnswer" -> "answers[0].selectedAnswer").
 */
function extractFieldErrors(data: unknown): Record<string, string[]> {
  if (!isRecord(data) || !isRecord(data.errors)) return {};

  const result: Record<string, string[]> = {};

  for (const [rawKey, value] of Object.entries(data.errors)) {
    const messages = Array.isArray(value)
      ? value.filter((m): m is string => typeof m === "string")
      : typeof value === "string"
        ? [value]
        : [];

    if (messages.length === 0) continue;

    const key = normaliseFieldKey(rawKey);
    result[key] = [...(result[key] ?? []), ...messages];
  }

  return result;
}

function normaliseFieldKey(key: string): string {
  const trimmed = key.replace(/^\$\.?/, "");
  if (!trimmed) return "general";

  return trimmed
    .split(".")
    .map((part) => (part ? part.charAt(0).toLowerCase() + part.slice(1) : part))
    .join(".");
}

function headerValue(headers: unknown, name: string): string | null {
  if (!headers) return null;

  const getter = (headers as { get?: (n: string) => unknown }).get;
  const value = typeof getter === "function"
    ? getter.call(headers, name)
    : (headers as Record<string, unknown>)[name] ?? (headers as Record<string, unknown>)[name.toLowerCase()];

  if (value === undefined || value === null) return null;
  return String(value);
}

/** Retry-After may be delta-seconds ("37") or an HTTP date. */
export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return null;

  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}
