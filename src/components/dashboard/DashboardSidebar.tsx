import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import {
  Calendar,
  LayoutDashboard,
  Users,
  User,
  Briefcase,
  Settings,
  Search,
  List,
  Plus,
  ClipboardList,
  Building2,
  Ruler,
  Tags,
  Store,
  Ticket,
  Heart,
  MessageSquare,
  LogOut,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface DashboardSidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const DashboardSidebar = ({ role, onLogout }: DashboardSidebarProps) => {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

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

  // Define navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      {
        name: 'Overview',
        path: `/dashboard/${role.toLowerCase()}`,
        icon: <LayoutDashboard className="w-5 h-5" />,
      }
    ];

    switch (role) {
      case UserRole.MANAGER:
        return [
          ...baseItems,
          {
            name: 'Exhibitions',
            path: `/dashboard/manager/exhibitions`,
            icon: <Calendar className="w-5 h-5" />,
          },
          {
            name: 'Applications',
            path: `/dashboard/manager/applications`,
            icon: <ClipboardList className="w-5 h-5" />,
          },
          {
            name: 'Brand Interests',
            path: `/dashboard/manager/brand-interests`,
            icon: <Heart className="w-5 h-5" />,
          },
          {
            name: 'Contact Messages',
            path: `/dashboard/manager/contact-messages`,
            icon: <MessageSquare className="w-5 h-5" />,
          },
          {
            name: 'Categories',
            path: `/dashboard/manager/categories`,
            icon: <Tags className="w-5 h-5" />,
          },
          {
            name: 'Venue Types',
            path: `/dashboard/manager/venue-types`,
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            name: 'Measurement Units',
            path: `/dashboard/manager/measurement-units`,
            icon: <Ruler className="w-5 h-5" />,
          },
          {
            name: 'Users',
            path: `/dashboard/manager/users`,
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: 'Settings',
            path: `/dashboard/manager/settings`,
            icon: <Settings className="w-5 h-5" />,
          }
        ];
      case UserRole.ORGANISER:
        return [
          {
            name: 'Overview',
            path: `/dashboard/${role.toLowerCase()}`,
            icon: <LayoutDashboard className="w-5 h-5" />,
          },
          {
            name: 'Exhibitions',
            path: `/dashboard/${role.toLowerCase()}/exhibitions`,
            icon: <Calendar className="w-5 h-5" />,
          },
          {
            name: 'Create Exhibition',
            path: `/dashboard/${role.toLowerCase()}/exhibitions/create`,
            icon: <Plus className="w-5 h-5" />,
          },
          {
            name: 'Applications',
            path: `/dashboard/${role.toLowerCase()}/applications`,
            icon: <ClipboardList className="w-5 h-5" />,
          },
          {
            name: 'Interest Inquiries',
            path: `/dashboard/${role.toLowerCase()}/interest-inquiries`,
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: 'Favorites',
            path: `/dashboard/organiser/favorites`,
            icon: <Heart className="w-5 h-5 text-red-500" />,
          },
          {
            name: 'Find Exhibitions',
            path: `/dashboard/organiser/find-exhibitions`,
            icon: <Search className="w-5 h-5" />,
          },
          {
            name: 'Coupons',
            path: `/dashboard/${role.toLowerCase()}/coupons`,
            icon: <Ticket className="w-5 h-5" />,
          },
          {
            name: 'Settings',
            path: `/dashboard/${role.toLowerCase()}/settings`,
            icon: <Settings className="w-5 h-5" />,
          },
        ];
      case UserRole.BRAND:
        return [
          {
            name: 'Overview',
            path: `/dashboard/brand`,
            icon: <LayoutDashboard className="w-5 h-5" />,
          },
          {
            name: 'My Stalls',
            path: `/dashboard/brand/stalls`,
            icon: <Store className="w-5 h-5" />,
          },
          {
            name: 'My Applications',
            path: `/dashboard/brand/applications`,
            icon: <List className="w-5 h-5" />,
          },
          {
            name: 'My Interests',
            path: `/dashboard/brand/interests`,
            icon: <Heart className="w-5 h-5" />,
          },
          {
            name: 'Favorites',
            path: `/dashboard/brand/favorites`,
            icon: <Heart className="w-5 h-5 text-red-500" />,
          },
          {
            name: 'Find Exhibitions',
            path: `/dashboard/brand/find`,
            icon: <Search className="w-5 h-5" />,
          },
          {
            name: 'Settings',
            path: `/dashboard/brand/settings`,
            icon: <Settings className="w-5 h-5" />,
          }
        ];
      case UserRole.SHOPPER:
        return [
          ...baseItems,
          {
            name: 'Recommended',
            path: `/dashboard/shopper/recommended`,
            icon: <Star className="w-5 h-5" />,
          },
          {
            name: 'Find Exhibitions',
            path: `/dashboard/shopper/find`,
            icon: <Search className="w-5 h-5" />,
          },
          {
            name: 'My Exhibitions',
            path: `/dashboard/shopper/my-exhibitions`,
            icon: <Calendar className="w-5 h-5" />,
          },
          {
            name: 'Favorites',
            path: `/dashboard/shopper/favorites`,
            icon: <Heart className="w-5 h-5" />,
          },
          {
            name: 'Settings',
            path: `/dashboard/shopper/settings`,
            icon: <Settings className="w-5 h-5" />,
          }
        ];
      default:
        return [...baseItems, {
          name: 'Settings',
          path: `/dashboard/${role.toLowerCase()}/settings`,
          icon: <Settings className="w-5 h-5" />,
        }];
    }
  };

  const navItems = getNavItems();

  const getInitials = () => {
    if (!user) return 'U';
    
    const name = user.user_metadata?.full_name || user.email || '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (role) {
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.ORGANISER:
        return 'Organiser';
      case UserRole.BRAND:
        return 'Brand';
      case UserRole.SHOPPER:
        return 'Shopper';
      default:
        return 'User';
    }
  };

  return (
    <div className="h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-6 flex items-center justify-center">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-exhibae-navy">Exhi<span className="text-exhibae-coral">Bae</span></span>
        </Link>
      </div>
      
      {/* User Profile Section */}
      <div className={cn("mx-4 p-4 rounded-lg mb-6", colorScheme.light, colorScheme.border)}>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border border-gray-200">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="Profile" />
            <AvatarFallback className={cn("text-white", colorScheme.primary)}>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>
            <span className="text-xs text-gray-500">{getRoleDisplayName()}</span>
          </div>
        </div>
      </div>
      
      <Separator className="mb-4" />
      
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = path === item.path;
            return (
              <Link 
                key={item.name}
                to={item.path} 
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? cn("text-white", colorScheme.primary)
                    : cn("text-gray-700 hover:text-gray-900", `hover:${colorScheme.light}`)
                )}
              >
                <span className={cn("mr-3", isActive ? "text-white" : colorScheme.text)}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4">
        <Separator className="mb-4" />
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-500" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
