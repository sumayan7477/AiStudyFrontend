/**
 * Decouples the axios client from AuthContext (no circular import):
 *   axios.ts  --notifyUnauthorized()-->  listeners  <--onUnauthorized()--  AuthContext (F2)
 *
 * When a request is rejected with 401 (expired/revoked token), the axios interceptor clears the
 * stored credentials and calls notifyUnauthorized(). If nothing is subscribed yet, the interceptor
 * falls back to a full redirect to /login (the previous behaviour).
 */

type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

/** Subscribe to "session is no longer valid" events. Returns an unsubscribe function. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify subscribers. Returns false when nobody is subscribed. */
export function notifyUnauthorized(): boolean {
  if (listeners.size === 0) return false;

  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Unauthorized listener failed", error);
    }
  });

  return true;
}
