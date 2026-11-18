import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getRedirectTarget } from "./redirect";

const PublicRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (isAuthenticated) {
        // Signed-in users never stay on /login or /register.
        return <Navigate to={getRedirectTarget(location.state)} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
