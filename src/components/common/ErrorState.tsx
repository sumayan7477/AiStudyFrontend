import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    /** Disables the retry button while a retry is running. */
    retrying?: boolean;
}

const ErrorState = ({ title = "Something went wrong", message, onRetry, retrying = false }: ErrorStateProps) => {
    return (
        <div role="alert" className="flex flex-col items-center rounded-lg bg-white p-8 text-center shadow">
            <AlertTriangle className="mb-3 text-red-500" size={32} aria-hidden="true" />

            <h2 className="mb-1 text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mb-5 max-w-md text-sm text-gray-600">{message}</p>

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    disabled={retrying}
                    className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
                >
                    <RotateCw size={16} className={retrying ? "animate-spin" : ""} aria-hidden="true" />
                    {retrying ? "Retrying..." : "Try again"}
                </button>
            )}
        </div>
    );
};

export default ErrorState;
