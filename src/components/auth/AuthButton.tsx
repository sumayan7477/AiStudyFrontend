import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

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
  if (isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
                alt="avatar" 
                className="rounded-full"
              />
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