const DEFAULT_AFTER_LOGIN = "/dashboard";
const AUTH_PAGES = ["/login", "/register"];

/**
 * Where to go after login: the protected page the user originally requested
 * (passed by ProtectedRoute as location.state.from), otherwise the dashboard.
 * Only in-app paths are accepted.
 */
export function getRedirectTarget(state: unknown): string {
    const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)?.from;
    const pathname = typeof from?.pathname === "string" ? from.pathname : null;

    if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//") || AUTH_PAGES.includes(pathname)) {
        return DEFAULT_AFTER_LOGIN;
    }

    const search = typeof from?.search === "string" ? from.search : "";
    const hash = typeof from?.hash === "string" ? from.hash : "";

    return `${pathname}${search}${hash}`;
}
