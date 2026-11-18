import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import authService from "../services/authService";

import type {
    LoginRequest,
    RegisterRequest,
    User,
} from "../types/auth";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;

    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const isAuthenticated = !!token;

    useEffect(() => {
        const initialize = async () => {
            try {
                const storedToken = localStorage.getItem("token");
                const storedUser = localStorage.getItem("user");

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    const login = async (data: LoginRequest) => {
        const response = await authService.login(data);

        const user: User = {
            email: response.email,
            fullName: response.fullName,
            roles: response.roles,
        };

        setToken(response.token);
        setUser(user);

        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(user));
    };

    const register = async (data: RegisterRequest) => {
        await authService.register(data);
    };

    const logout = () => {
        setUser(null);
        setToken(null);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};