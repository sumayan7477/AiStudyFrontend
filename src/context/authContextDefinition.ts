import { createContext } from "react";
import type { LoginRequest, RegisterRequest, User } from "../types/auth";

export interface AuthContextType {
    /** Current user from GET /api/auth/me (null when signed out). */
    user: User | null;
    token: string | null;
    /** When the current token expires (UTC); the session ends automatically at this time. */
    expiresAt: Date | null;
    isAuthenticated: boolean;
    /** True while a stored session is being validated on startup. */
    loading: boolean;

    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

/** Kept in its own module so AuthContext.tsx only exports components (React Fast Refresh). */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
