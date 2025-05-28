import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import ProfileDropdown from './ProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
import { Logo } from '@/components/ui/logo';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        // First check user_metadata for role
        const metadataRole = user.user_metadata?.role;
        if (metadataRole) {
          setUserRole(metadataRole);
          return;
        }

        // Fallback to profiles table if no role in metadata
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  // Convert onLogout to return a Promise
  const handleLogout = async () => {
    onLogout();
    return Promise.resolve();
  };

  return (
    <header className="w-full bg-[#E6C5B6] shadow-sm py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Logo preset="header" className="h-14" />
          </Link>
        </div>

        <nav className="hidden md:flex space-x-6">
          <Link 
            to="/" 
            className={`subheading-text ${location.pathname === '/' ? 'text-[#4B1E25]' : 'text-font-color hover:text-[#4B1E25]'}`}
          >
            Home
          </Link>
          
          <Link 
            to="/exhibitions" 
            className={`subheading-text ${location.pathname === '/exhibitions' ? 'text-[#4B1E25]' : 'text-font-color hover:text-[#4B1E25]'}`}
          >
            Exhibitions
          </Link>
          
          <Link 
            to="/brands" 
            className={`subheading-text ${location.pathname.startsWith('/brands') ? 'text-[#4B1E25]' : 'text-font-color hover:text-[#4B1E25]'}`}
          >
            Brands
          </Link>
          
          <Link 
            to="/about" 
            className={`subheading-text ${location.pathname === '/about' ? 'text-[#4B1E25]' : 'text-font-color hover:text-[#4B1E25]'}`}
          >
            About
          </Link>
          
          <Link 
            to="/contact" 
            className={`subheading-text ${location.pathname === '/contact' ? 'text-[#4B1E25]' : 'text-font-color hover:text-[#4B1E25]'}`}
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <ProfileDropdown onLogout={handleLogout} />
          ) : (
            <>
              <Button 
                variant="ghost"
                onClick={onLogin}
                className="text-font-color hover:text-[#4B1E25] subheading-text"
              >
                Log In
              </Button>
              <Button 
                onClick={onSignUp}
                className="bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA] subheading-text"
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
