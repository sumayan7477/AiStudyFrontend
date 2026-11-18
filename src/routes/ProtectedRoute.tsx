import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        // Remember where the user was going so login can send them back there.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
