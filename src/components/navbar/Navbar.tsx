import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  TrophyIcon,
  UserIcon,
  Cog6ToothIcon,
  QueueListIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import AuthButton from '../auth/AuthButton';
import ThemeToggle from '../ui/ThemeToggle';

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated = false, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Main navigation links
  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/dashboard', label: 'Dashboard', icon: ClipboardDocumentListIcon, protected: true },
    { path: '/chat', label: 'AI Chat', icon: ChatBubbleLeftRightIcon, protected: true },
  ];

  // Sidebar links (full menu)
  const sidebarLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: ClipboardDocumentListIcon },
    { path: '/chat', label: 'AI Chat', icon: ChatBubbleLeftRightIcon },
    { path: '/study-plans', label: 'Study Plans', icon: QueueListIcon },
    { path: '/quizzes', label: 'Quizzes', icon: PuzzlePieceIcon },
    { path: '/notes', label: 'Notes', icon: DocumentTextIcon },
    { path: '/flashcards', label: 'Flashcards', icon: LightBulbIcon },
    { path: '/progress', label: 'Progress', icon: ChartBarIcon },
    { path: '/gamification', label: 'Gamification', icon: TrophyIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  const filteredNavLinks = navLinks.filter(link => 
    !link.protected || (link.protected && isAuthenticated)
  );

  // Filter sidebar links based on authentication
  const filteredSidebarLinks = isAuthenticated ? sidebarLinks : sidebarLinks.filter(link => 
    ['/dashboard', '/chat'].includes(link.path)
  );

  return (
    <>
      {/* Main Navbar */}
      <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 border-b border-base-200">
        <div className="navbar-start">
          {/* Sidebar Toggle Button */}
          <button 
            className="btn btn-ghost btn-circle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Mobile Menu Button */}
          <div className="dropdown lg:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-circle" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </label>
            <ul 
              tabIndex={0} 
              className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 ${isMobileMenuOpen ? 'block' : 'hidden'}`}
            >
              {filteredNavLinks.map((link) => (
                <li key={link.path} onClick={closeMobileMenu}>
                  <Link 
                    to={link.path} 
                    className={`${isActive(link.path) ? 'active' : ''}`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Brand Logo */}
          <Link to="/" className="btn btn-ghost normal-case text-xl gap-2 ml-2">
            <AcademicCapIcon className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">
              <span className="text-primary">AI</span>StudyAssistant
            </span>
            <span className="sm:hidden">
              <span className="text-primary">AI</span>SA
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {filteredNavLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  className={`${isActive(link.path) ? 'active' : ''} gap-2`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side - Auth and Theme */}
        <div className="navbar-end gap-2">
          <ThemeToggle />
          <AuthButton isAuthenticated={isAuthenticated} onLogout={onLogout} />
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <AcademicCapIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">
              <span className="text-primary">AI</span>StudyAssistant
            </span>
          </Link>
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
          <ul className="menu bg-base-100 w-full">
            {filteredSidebarLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  className={`${isActive(link.path) ? 'active' : ''} gap-3 py-3 px-4 rounded-lg transition-colors`}
                  onClick={closeSidebar}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                  {isActive(link.path) && (
                    <span className="badge badge-primary badge-sm ml-auto">Active</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Sidebar Footer / User Info */}
          {isAuthenticated && (
            <div className="mt-8 pt-4 border-t border-base-200">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-10">
                    <span className="text-sm">JD</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm">John Doe</p>
                  <p className="text-xs opacity-60">Student</p>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Navbar;