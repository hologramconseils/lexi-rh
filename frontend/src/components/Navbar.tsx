import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User as UserIcon, LogOut, Menu, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  variant?: 'public' | 'admin';
  showBackButton?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'public', showBackButton = false }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  const navBrand = variant === 'admin' ? 'Lexi-RH Admin' : 'Lexi-RH';
  const navBadge = variant === 'admin' ? 'Espace employeur / RH' : 'Espace Salarié';

  return (
    <nav className="bg-white dark:bg-slate-900 shadow border-b border-slate-200 dark:border-slate-800 transition-colors sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section: Logo & Badge or Back Button */}
          <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)} 
                className="mr-4 p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" 
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <Link to={variant === 'admin' ? "/profile" : "/"} className="flex items-center space-x-2 text-blue-600 dark:text-blue-500 hover:opacity-80 transition-opacity focus-visible:outline-none" title={variant === 'admin' ? "Informations du compte" : "Retour à l'accueil"}>
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                {navBrand}
              </h1>
              <span className="hidden xs:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {navBadge}
              </span>
            </Link>
          </div>

          {/* Desktop Right section */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/profile" className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <UserIcon className="w-4 h-4 mr-1.5" /> Mon Profil
                </Link>
                {user.role === 'admin' && variant !== 'admin' && (
                  <Link to="/admin" className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4 mr-1.5" /> Déconnexion
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                <UserIcon className="w-4 h-4 mr-1.5" /> Espace employeur / RH
              </Link>
            )}
          </div>

          {/* Mobile Right section: Theme toggle & Hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Menu Utilisateur
                </div>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 mr-3 text-slate-400" />
                    Mon Profil
                  </div>
                </Link>
                {user.role === 'admin' && variant !== 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-3" />
                      Administration
                    </div>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-800 mt-2 pt-4"
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-3" />
                    Déconnexion
                  </div>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <UserIcon className="w-5 h-5 mr-3" />
                  Espace employeur / RH
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
