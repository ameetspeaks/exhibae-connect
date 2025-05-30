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
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [isOpen, setIsOpen] = useState(false);

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

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/exhibitions', label: 'Exhibitions' },
    { path: '/brands', label: 'Brands' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <header className="w-full bg-[#E6C5B6] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center">
            <ExhibaeLogo variant="header" className="h-10 sm:h-12" />
          </Link>
          <SearchBar className="hidden md:flex w-[300px]" />
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`subheading-text ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path)) 
                    ? 'text-[#4B1E25]' 
                    : 'text-font-color hover:text-[#4B1E25]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-[#4B1E25] hover:text-[#4B1E25]/90">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[380px] bg-[#F5E4DA] border-l border-[#4B1E25]/10">
              <div className="flex flex-col gap-6 mt-8">
                <SearchBar className="w-full" />
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`subheading-text text-lg p-2 rounded-md transition-colors ${
                        (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path))
                          ? 'text-[#4B1E25] bg-[#4B1E25]/5'
                          : 'text-font-color hover:text-[#4B1E25] hover:bg-[#4B1E25]/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                {!isAuthenticated && (
                  <div className="flex flex-col gap-3 mt-4">
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        setIsOpen(false);
                        onLogin();
                      }}
                      className="w-full text-font-color hover:text-[#4B1E25] hover:bg-[#4B1E25]/5 subheading-text"
                    >
                      Log In
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsOpen(false);
                        onSignUp();
                      }}
                      className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA] subheading-text"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Auth Buttons */}
          {isAuthenticated ? (
            <ProfileDropdown onLogout={handleLogout} />
          ) : (
            <div className="hidden md:flex items-center gap-6">
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
