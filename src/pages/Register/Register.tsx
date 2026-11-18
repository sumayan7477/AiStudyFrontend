import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
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

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            await axios.post("/Auth/register", formData);

            alert("Registration successful");

            navigate("/login");
        } catch (error: any) {
            alert(error.response?.data?.message || "Registration failed");
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
                    Register
                </h2>

                <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mb-4 w-full rounded border p-3"
                    required
                />

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

                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mb-4 w-full rounded border p-3"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-indigo-600 py-3 text-white"
                >
                    {loading ? "Registering..." : "Register"}
                </button>

                <p className="mt-4 text-center">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-indigo-600"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Register;