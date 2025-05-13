import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';

type HeaderProps = {
  isAuthenticated: boolean;
  onLogin: () => void;
  onSignUp: () => void;
  onLogout: () => void;
};

const Header = ({ 
  isAuthenticated, 
  onLogin, 
  onSignUp, 
  onLogout 
}: HeaderProps) => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <header className="w-full bg-white shadow-sm py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-exhibae-navy">Exhi<span className="text-exhibae-coral">Bae</span></span>
          </Link>
        </div>

        <nav className="hidden md:flex space-x-6">
          <Link 
            to="/" 
            className={`font-medium ${location.pathname === '/' ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
          >
            Home
          </Link>
          <Link 
            to="/exhibitions" 
            className={`font-medium ${location.pathname === '/exhibitions' ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
          >
            Exhibitions
          </Link>
          <Link 
            to="/about" 
            className={`font-medium ${location.pathname === '/about' ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
          >
            About
          </Link>
          {isAuthenticated && user && (
            <Link 
              to="/dashboard" 
              className={`font-medium ${location.pathname.includes('/dashboard') ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Button 
              variant="ghost"
              onClick={onLogout}
              className="text-gray-600 hover:text-exhibae-navy"
            >
              Log Out
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost"
                onClick={onLogin}
                className="text-gray-600 hover:text-exhibae-navy"
              >
                Log In
              </Button>
              <Button 
                onClick={onSignUp}
                className="bg-exhibae-coral hover:bg-opacity-90 text-white"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
