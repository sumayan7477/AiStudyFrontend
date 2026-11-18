export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface User {
    email: string;
    fullName: string;
    roles: string[];
}

export interface LoginResponse {
    token: string;
    email: string;
    fullName: string;
    roles: string[];
}