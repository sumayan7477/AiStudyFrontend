import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/useAuth';

interface AuthButtonProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ 
  isAuthenticated = false, 
  onLogout,
  className = ''
}) => {
  const { user } = useAuth();

  if (isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="dropdown dropdown-end">
          {/* Initial instead of a third-party avatar image (no request to an external service). */}
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder" aria-label="Account menu">
            <div className="w-10 rounded-full bg-primary text-primary-content ring ring-primary ring-offset-2 ring-offset-base-100">
              <span className="text-sm font-semibold" aria-hidden="true">{user?.fullName?.trim().charAt(0).toUpperCase() || "?"}</span>
            </div>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52">
            <li>
              <Link to="/dashboard" className="justify-between">
                Dashboard
                <span className="badge badge-primary">New</span>
              </Link>
            </li>
            <li>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <button onClick={onLogout} className="text-error gap-2">
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link to="/login" className="btn btn-ghost btn-sm">
        Login
      </Link>
      <Link to="/register" className="btn btn-primary btn-sm">
        Register
      </Link>
    </div>
  );
};

export default AuthButton;