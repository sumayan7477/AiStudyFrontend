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
            data
        );

        return response.data;
    },

    register: async (data: RegisterRequest): Promise<void> => {
        await api.post("/Auth/register", data);
    },

    me: async (): Promise<User> => {
        const response = await api.get<User>("/Auth/me");
        return response.data;
    }
};

export default authService;