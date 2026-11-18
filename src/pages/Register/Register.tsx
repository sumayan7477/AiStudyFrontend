import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { formatApiError, parseApiError } from "../../api/errors";
import { useAuth } from "../../context/useAuth";
import type { RegisterFormValues } from "../../types/auth";
import {
    PASSWORD_RULES_TEXT,
    pickFieldErrors,
    validateRegistration,
    type FieldErrors,
} from "../../utils/validation";

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState<RegisterFormValues>({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterFormValues>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof RegisterFormValues;

        setFormData({
            ...formData,
            [name]: e.target.value,
        });

        setFieldErrors({ ...fieldErrors, [name]: undefined });
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Same rules as the API: 8-128 chars, uppercase, lowercase, digit; passwords match.
        const clientErrors = validateRegistration(formData);
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        try {
            setLoading(true);
            setFormError(null);

            // confirmPassword is never sent to the API.
            const email = formData.email.trim();
            await register({
                fullName: formData.fullName.trim(),
                email,
                password: formData.password,
            });

            toast.success("Registration successful. Please log in.");
            navigate("/login", { state: { email } });
        } catch (error: unknown) {
            const apiError = parseApiError(error);
            const serverFieldErrors = pickFieldErrors<RegisterFormValues>(
                apiError.fieldErrors,
                ["fullName", "email", "password"],
            );

            setFieldErrors(serverFieldErrors);

            // Show the general message unless every error is already shown beside a field.
            const allShownBesideFields =
                Object.keys(serverFieldErrors).length > 0 &&
                Object.keys(apiError.fieldErrors).every((key) => key in serverFieldErrors) &&
                apiError.message === "Validation Failed";

            setFormError(allShownBesideFields ? null : formatApiError(apiError));
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
                    Register
                </h2>

                {formError && (
                    <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
                        {formError}
                    </p>
                )}

                <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.fullName}
                    className="mb-4 w-full rounded border p-3"
                    required
                />
                {fieldErrors.fullName && (
                    <p className="-mt-3 mb-4 text-sm text-red-600">{fieldErrors.fullName}</p>
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.password}
                    className="mb-4 w-full rounded border p-3"
                    required
                />
                {fieldErrors.password ? (
                    <p className="-mt-3 mb-4 text-sm text-red-600">{fieldErrors.password}</p>
                ) : (
                    <p className="-mt-3 mb-4 text-xs text-gray-500">{PASSWORD_RULES_TEXT}</p>
                )}

                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.confirmPassword}
                    className="mb-4 w-full rounded border p-3"
                    required
                />
                {fieldErrors.confirmPassword && (
                    <p className="-mt-3 mb-4 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}

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
