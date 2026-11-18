import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import toast from "react-hot-toast";

import { onUnauthorized } from "../api/authEvents";
import { parseApiError } from "../api/errors";
import authService from "../services/authService";
import {
    clearAuthStorage,
    getStoredUser,
    getToken,
    getTokenExpiry,
    isTokenExpired,
    setStoredUser,
    setToken as storeToken,
} from "../utils/token";
import { AuthContext, type AuthContextType } from "./authContextDefinition";

import type { LoginRequest, RegisterRequest, User } from "../types/auth";

interface Props {
    children: ReactNode;
}

/** setTimeout's maximum delay (~24.8 days); tokens are far shorter (API max 24 h). */
const MAX_TIMER_MS = 2_147_483_647;
const SESSION_EXPIRED_TOAST_ID = "session-expired";

/** Stored token at startup, discarding one that has already expired. */
function readInitialToken(): string | null {
    const stored = getToken();

    if (stored && isTokenExpired(stored)) {
        clearAuthStorage();
        return null;
    }

    return stored;
}

/**
 * Session lifecycle:
 *  - Startup: a stored token is validated with GET /api/auth/me before the app treats it as signed in.
 *  - Login:   POST /api/auth/login, then /auth/me for the full user (id, fullName, email, roles).
 *  - Expiry:  logs out automatically at expiresAt (from the login response, or the token's exp after reload).
 *  - 401:     the axios client signals "session expired" through api/authEvents (no circular import).
 *  - Logout:  clears token + cached user; ProtectedRoute then redirects to /login.
 */
export const AuthProvider = ({ children }: Props) => {
    const [pendingToken] = useState<string | null>(readInitialToken);

    const [user, setUser] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [loading, setLoading] = useState<boolean>(pendingToken !== null);

    // Lets callbacks know whether a session is active without depending on state.
    const sessionActive = useRef(false);

    const endSession = useCallback((reason?: "expired") => {
        const wasActive = sessionActive.current;
        sessionActive.current = false;

        clearAuthStorage();
        setUser(null);
        setTokenState(null);
        setExpiresAt(null);

        if (reason === "expired" && wasActive) {
            toast.error("Your session has expired. Please log in again.", {
                id: SESSION_EXPIRED_TOAST_ID,
            });
        }
    }, []);

    const startSession = useCallback((newToken: string, newUser: User, expiry: Date | null) => {
        sessionActive.current = true;
        setStoredUser(newUser);
        setUser(newUser);
        setTokenState(newToken);
        setExpiresAt(expiry);
    }, []);

    // React to 401s from any request (token expired, revoked, user deactivated).
    useEffect(() => onUnauthorized(() => endSession("expired")), [endSession]);

    // Validate a stored token on startup.
    useEffect(() => {
        if (!pendingToken) return;

        let cancelled = false;

        const validate = async () => {
            try {
                const currentUser = await authService.me();
                if (!cancelled) startSession(pendingToken, currentUser, getTokenExpiry(pendingToken));
            } catch (error) {
                if (cancelled) return;

                const { kind } = parseApiError(error);
                const cachedUser = getStoredUser<User>();

                if ((kind === "network" || kind === "timeout" || kind === "server") && cachedUser?.id) {
                    // API unreachable: keep the (unexpired) session; requests will report their own errors.
                    startSession(pendingToken, cachedUser, getTokenExpiry(pendingToken));
                } else {
                    // 401 (already cleared by the axios client) or any other failure.
                    clearAuthStorage();
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void validate();

        return () => {
            cancelled = true;
        };
    }, [pendingToken, startSession]);

    // Automatic logout when the token expires.
    useEffect(() => {
        if (!expiresAt) return;

        const delay = Math.min(Math.max(expiresAt.getTime() - Date.now(), 0), MAX_TIMER_MS);
        const timer = window.setTimeout(() => endSession("expired"), delay);

        return () => window.clearTimeout(timer);
    }, [expiresAt, endSession]);

    const login = useCallback(async (data: LoginRequest) => {
        const response = await authService.login(data);

        // Stored first so the /auth/me request below is authenticated.
        storeToken(response.token);

        let currentUser: User;
        try {
            currentUser = await authService.me();
        } catch (error) {
            clearAuthStorage();
            throw error;
        }

        const expiry = response.expiresAt ? new Date(response.expiresAt) : getTokenExpiry(response.token);
        startSession(response.token, currentUser, expiry);
    }, [startSession]);

    const register = useCallback(async (data: RegisterRequest) => {
        await authService.register(data);
    }, []);

    const logout = useCallback(() => endSession(), [endSession]);

    const value = useMemo<AuthContextType>(() => ({
        user,
        token,
        expiresAt,
        isAuthenticated: token !== null && user !== null,
        loading,
        login,
        register,
        logout,
    }), [user, token, expiresAt, loading, login, register, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
