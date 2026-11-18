import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            const response = await axios.post("/Auth/login", formData);

            localStorage.setItem("token", response.data.token);

            localStorage.setItem(
                "user",
                JSON.stringify({
                    email: response.data.email,
                    fullName: response.data.fullName,
                    roles: response.data.roles,
                })
            );
            
            navigate("/dashboard");
        } catch (error: any) {
            alert(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-lg bg-white p-8 shadow"
            >
                <h2 className="mb-6 text-center text-3xl font-bold">
                    Login
                </h2>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mb-4 w-full rounded border p-3"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mb-4 w-full rounded border p-3"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-indigo-600 py-3 text-white"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="mt-4 text-center">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-indigo-600"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;