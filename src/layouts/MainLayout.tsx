import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';

// You can manage auth state here or use a context
const isAuthenticated = false; // Replace with actual auth state

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar isAuthenticated={isAuthenticated} />
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