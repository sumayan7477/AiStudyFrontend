import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatApiError, parseApiError } from "../../api/errors";
import { useAuth } from "../../context/useAuth";
import { getRedirectTarget } from "../../routes/redirect";
import type { LoginRequest } from "../../types/auth";
import { pickFieldErrors, validateLogin, type FieldErrors } from "../../utils/validation";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Prefilled after a successful registration.
    const prefilledEmail = (location.state as { email?: unknown } | null)?.email;

    const [formData, setFormData] = useState<LoginRequest>({
        email: typeof prefilledEmail === "string" ? prefilledEmail : "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginRequest>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof LoginRequest;

        setFormData({
            ...formData,
            [name]: e.target.value,
        });

        setFieldErrors({ ...fieldErrors, [name]: undefined });
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const clientErrors = validateLogin(formData);
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        try {
            setLoading(true);
            setFormError(null);

            await login({ email: formData.email.trim(), password: formData.password });

            navigate(getRedirectTarget(location.state), { replace: true });
        } catch (error: unknown) {
            const apiError = parseApiError(error);
            const serverFieldErrors = pickFieldErrors<LoginRequest>(apiError.fieldErrors, ["email", "password"]);

            setFieldErrors(serverFieldErrors);
            setFormError(
                Object.keys(serverFieldErrors).length > 0 && apiError.kind === "validation"
                    ? null
                    : formatApiError(apiError)
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                noValidate
                className="w-full max-w-md rounded-lg bg-white p-8 shadow"
            >
                <h2 className="mb-6 text-center text-3xl font-bold">
                    Login
                </h2>

                {formError && (
                    <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
                        {formError}
                    </p>
                )}

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.email}
                    className="mb-4 w-full rounded border p-3"
                    required
                />
                {fieldErrors.email && (
                    <p className="-mt-3 mb-4 text-sm text-red-600">{fieldErrors.email}</p>
                )}

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.password}
                    className="mb-4 w-full rounded border p-3"
                    required
                />
                {fieldErrors.password && (
                    <p className="-mt-3 mb-4 text-sm text-red-600">{fieldErrors.password}</p>
                )}

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
