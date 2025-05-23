import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import ProfileDropdown from './ProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
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
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                    <Link 
                      to="/for-organizers"
                      className="block p-3 space-y-1 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="font-medium">For Organizers</div>
                      <p className="text-sm text-gray-600">Create and manage exhibitions with powerful tools</p>
                    </Link>
                    <Link 
                      to="/for-brands"
                      className="block p-3 space-y-1 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="font-medium">For Brands</div>
                      <p className="text-sm text-gray-600">Find and participate in relevant exhibitions</p>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Link 
            to="/exhibitions" 
            className={`font-medium ${location.pathname === '/exhibitions' ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
          >
            Exhibitions
          </Link>
          
          <Link 
            to="/brands" 
            className={`font-medium ${location.pathname.startsWith('/brands') ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
          >
            Brands
          </Link>
          
          <Link 
            to="/about" 
            className={`font-medium ${location.pathname === '/about' ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
          >
            About
          </Link>
          
          <Link 
            to="/contact" 
            className={`font-medium ${location.pathname === '/contact' ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
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
