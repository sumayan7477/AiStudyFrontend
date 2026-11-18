import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';
import { useAuth } from '../context/useAuth';

const MainLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar isAuthenticated={isAuthenticated} onLogout={logout} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
          <p>© 2026 AIStudyAssistant - All rights reserved</p>
        </aside>
      </footer>
    </div>
  );
};

export default MainLayout;
