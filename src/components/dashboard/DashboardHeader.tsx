import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Home, 
  Calendar, 
  Info, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Building2, 
  Tags 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types/auth';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ProfileDropdown from '../layout/ProfileDropdown';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  role: UserRole;
  title: string;
}

const DashboardHeader = ({ role, title }: DashboardHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isShopperRole = role === UserRole.SHOPPER;

  // Define role-specific color schemes
  const getRoleColorScheme = () => {
    switch (role) {
      case UserRole.MANAGER:
        return {
          primary: 'bg-indigo-600',
          hover: 'hover:bg-indigo-700',
          light: 'bg-indigo-50',
          text: 'text-indigo-600',
          border: 'border-indigo-200'
        };
      case UserRole.ORGANISER:
        return {
          primary: 'bg-emerald-600',
          hover: 'hover:bg-emerald-700',
          light: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-200'
        };
      case UserRole.BRAND:
        return {
          primary: 'bg-amber-600',
          hover: 'hover:bg-amber-700',
          light: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200'
        };
      default:
        return {
          primary: 'bg-exhibae-navy',
          hover: 'hover:bg-blue-800',
          light: 'bg-blue-50',
          text: 'text-exhibae-navy',
          border: 'border-blue-200'
        };
    }
  };

  const colorScheme = getRoleColorScheme();

  // Common navigation links for all roles
  const commonLinks = [
    { path: '/', label: 'Home', icon: <Home className="h-5 w-5 mr-3" /> },
    { path: '/exhibitions', label: 'Exhibitions', icon: <Calendar className="h-5 w-5 mr-3" /> }
  ];

  // Role-specific navigation links
  const getRoleLinks = () => {
    const dashboardPath = `/dashboard/${role.toLowerCase()}`;
    
    switch(role) {
      case UserRole.SHOPPER:
        return [
          ...commonLinks,
          { path: '/about', label: 'About', icon: <Info className="h-5 w-5 mr-3" /> }
        ];
      
      case UserRole.BRAND:
        return [
          ...commonLinks,
          { path: dashboardPath, label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> }
        ];
      
      case UserRole.ORGANISER:
        return [
          ...commonLinks,
          { path: dashboardPath, label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
          { path: `${dashboardPath}/exhibitions`, label: 'My Exhibitions', icon: <Calendar className="h-5 w-5 mr-3" /> }
        ];
      
      case UserRole.MANAGER:
        return [
          ...commonLinks,
          { path: dashboardPath, label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
          { path: `${dashboardPath}/users`, label: 'Users', icon: <Users className="h-5 w-5 mr-3" /> }
        ];
      
      default:
        return commonLinks;
    }
  };

  const navigationLinks = getRoleLinks();

  // Shopper-specific header with navigation
  if (isShopperRole) {
    return (
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center mr-6">
              <span className="text-2xl font-bold text-exhibae-navy">Exhi<span className="text-exhibae-coral">Bae</span></span>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigationLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`flex items-center ${location.pathname === link.path ? 'text-exhibae-navy' : 'text-gray-600 hover:text-exhibae-navy'}`}
                >
                  {React.cloneElement(link.icon, { className: "h-4 w-4 mr-1" })}
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {navigationLinks.map((link) => (
                      <Link 
                        key={link.path}
                        to={link.path} 
                        className={`flex items-center p-2 rounded-md ${
                          location.pathname === link.path 
                            ? 'bg-gray-100 text-exhibae-navy' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-exhibae-navy'
                        }`}
                      >
                        {link.icon}
                        <span className="font-medium">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search exhibitions..."
                className="pl-10 w-64 bg-gray-50"
              />
            </div>
            
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </div>
      </div>
    );
  }

  // Simplified header for other roles (with sidebar)
  return (
    <div className={cn("border-b border-gray-200 bg-white p-4", colorScheme.border)}>
      <div className="flex items-center justify-between">
        <h1 className={cn("text-2xl font-semibold", colorScheme.text)}>{title}</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-50"
            />
          </div>
          
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
