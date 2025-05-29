import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import ProfileDropdown from './ProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
import { ExhibaeLogo } from '@/components/ui/ExhibaeLogo';
import { SearchBar } from '@/components/ui/SearchBar';
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
    <header className="w-full bg-[#E6C5B6] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <ExhibaeLogo variant="header" className="h-12" />
          </Link>
          <SearchBar className="hidden md:flex w-[300px]" />
          <nav className="hidden md:flex items-center space-x-8">
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
        </div>

        <div className="flex items-center gap-6">
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
