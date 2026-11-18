/**
 * Error body returned by the backend for every failed request
 * (Common/ApiResponse.cs): validation, 401/403/404/429, AI failures and server errors.
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  /** Validation errors keyed by field name, e.g. { "Password": ["..."] }. */
  errors: Record<string, string[]> | null;
  /** Matches the server log entry; absent on validation errors. */
  traceId?: string;
}

/** Simple success body used by register, profile update and delete endpoints. */
export interface ApiMessageResponse {
  message: string;
}
