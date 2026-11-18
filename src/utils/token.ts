/**
 * Single place for the auth storage keys.
 *
 * "token" and "user" are the keys AuthContext and the login page already use.
 * (This file previously used "accessToken", which nothing else read or wrote,
 * so tokens stored here were never sent with requests.)
 */
export const TOKEN_STORAGE_KEY = "token";
export const USER_STORAGE_KEY = "user";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null; // storage unavailable (private mode / blocked)
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // storage unavailable; the session will not survive a reload
  }
};

export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * Reads the "exp" claim from a JWT (no signature check; the server validates the token).
 * Used to restore the expiry after a page reload without storing it separately.
 */
export const getTokenExpiry = (token: string | null): Date | null => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as { exp?: unknown };

    return typeof claims.exp === "number" ? new Date(claims.exp * 1000) : null;
  } catch {
    return null;
  }
};

/** True when the token has an expiry that is already in the past. */
export const isTokenExpired = (token: string | null, now: number = Date.now()): boolean => {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry.getTime() <= now;
};

/** Cached copy of the current user (refreshed from /auth/me on every app start). */
export const getStoredUser = <T>(): T | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown): void => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

/** Removes every stored credential (token and cached user). */
export const clearAuthStorage = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }
};
