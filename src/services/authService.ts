import api from "../api/axios";
import type {
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    User
} from "../types/auth";

const authService = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>(
            "/Auth/login",
            { email: data.email, password: data.password }
        );

        return response.data;
    },

    register: async (data: RegisterRequest): Promise<void> => {
        // Send only the fields the API accepts (never confirmPassword).
        await api.post("/Auth/register", {
            fullName: data.fullName,
            email: data.email,
            password: data.password,
        });
    },

    me: async (): Promise<User> => {
        const response = await api.get<User>("/Auth/me");
        return response.data;
    }
};

export default authService;
