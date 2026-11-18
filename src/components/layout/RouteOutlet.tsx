import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AlertTriangle, RotateCw } from "lucide-react";

/** Shown while a lazily loaded page is downloading. */
export function PageLoader() {
    return (
        <div role="status" aria-live="polite" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" aria-hidden="true" />
            Loading page...
        </div>
    );
}

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i;

interface BoundaryProps {
    /** Changing this (the route path) clears a previous error, so navigating away recovers. */
    resetKey: string;
    children: ReactNode;
}

interface BoundaryState {
    error: Error | null;
}

/**
 * Catches errors while loading or rendering a page (e.g. a lazy page chunk that failed to download
 * after a deployment or on a flaky connection) and shows a recovery screen instead of a blank app.
 */
class RouteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
    state: BoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): BoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Page failed to load or render", error, info.componentStack);
    }

    componentDidUpdate(previous: BoundaryProps) {
        if (previous.resetKey !== this.props.resetKey && this.state.error) {
            this.setState({ error: null });
        }
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        const chunkFailed = CHUNK_ERROR.test(error.message);
        return (
            <div role="alert" className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-lg bg-white p-8 text-center shadow">
                <AlertTriangle className="mb-3 text-red-500" size={32} aria-hidden="true" />
                <h1 className="mb-1 text-lg font-semibold text-gray-900">
                    {chunkFailed ? "This page could not be loaded" : "Something went wrong on this page"}
                </h1>
                <p className="mb-5 text-sm text-gray-600">
                    {chunkFailed
                        ? "Check your internet connection, then reload. If the app was just updated, reloading fetches the new version."
                        : "Reloading the page usually fixes this."}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                    >
                        <RotateCw size={16} aria-hidden="true" />
                        Reload page
                    </button>
                    <Link to="/" className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-50">Go to home page</Link>
                </div>
            </div>
        );
    }
}

/** Error boundary + Suspense around a layout's <Outlet />: the layout stays visible while a page loads. */
export default function RouteOutlet() {
    const { pathname } = useLocation();
    return (
        <RouteErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
        </RouteErrorBoundary>
    );
}

/** The same protection for routes rendered outside a layout (e.g. the 404 page). */
export function RouteBoundary({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    return (
        <RouteErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </RouteErrorBoundary>
    );
}
