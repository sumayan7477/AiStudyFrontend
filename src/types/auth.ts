export interface LoginRequest {
    email: string;
    password: string;
}

/** Body sent to POST /api/auth/register (RegisterDto). */
export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
}

/** Registration form values; confirmPassword is checked on the client only and never sent. */
export interface RegisterFormValues extends RegisterRequest {
    confirmPassword: string;
}

/** Current user as returned by GET /api/auth/me. */
export interface User {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
}

/** POST /api/auth/login response (AuthResponseDto). */
export interface LoginResponse {
    token: string;
    email: string;
    fullName: string;
    roles: string[];
    /** UTC expiry of the token (ISO-8601). */
    expiresAt?: string;
}
