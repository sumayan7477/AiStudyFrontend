import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
                <Compass className="mx-auto mb-3 text-indigo-500" size={36} aria-hidden="true" />
                <h1 className="mb-1 text-2xl font-bold text-gray-900">404 - Page Not Found</h1>
                <p className="mb-6 text-sm text-gray-600">The page you are looking for does not exist or has moved.</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/dashboard" className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Go to dashboard</Link>
                    <Link to="/" className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-50">Home page</Link>
                </div>
            </div>
        </main>
    );
}
