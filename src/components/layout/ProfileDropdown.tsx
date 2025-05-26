import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  LogOut, 
  Calendar, 
  Compass, 
  Settings, 
  Heart, 
  ChevronDown,
  LayoutDashboard,
  Store,
  List,
  Search,
  ClipboardList,
  Plus,
  Users,
  Building2,
  Tags,
  Ruler,
  Ticket,
  Star
} from 'lucide-react';
import { UserRole } from '@/types/auth';

interface ProfileDropdownProps {
  onLogout?: () => Promise<void>;
}

const ProfileDropdown = ({ onLogout }: ProfileDropdownProps) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
      setUserRole(user.user_metadata?.role?.toLowerCase() || null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await logout();
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const getMenuItems = () => {
    const dashboardPath = `/dashboard/${userRole}`;

    // Common menu items for all roles
    const commonItems = [
      {
        label: 'Dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
        path: dashboardPath,
      },
      {
        label: 'Settings',
        icon: <Settings className="mr-2 h-4 w-4" />,
        path: `${dashboardPath}/settings`,
      }
    ];

    // Role-specific menu items
    switch(userRole) {
      case UserRole.SHOPPER.toLowerCase():
        return [
          ...commonItems,
          {
            label: 'My Exhibitions',
            icon: <Calendar className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/my-exhibitions`,
          },
          {
            label: 'My Favorites',
            icon: <Heart className="mr-2 h-4 w-4 text-red-500" />,
            path: `${dashboardPath}/favorites`,
          },
          {
            label: 'Recommended',
            icon: <Heart className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/recommended`,
          },
          {
            label: 'Find Exhibitions',
            icon: <Compass className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/find`,
          }
        ];
      
      case UserRole.BRAND.toLowerCase():
        return [
          ...commonItems,
          {
            label: 'My Stalls',
            icon: <Store className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/stalls`,
          },
          {
            label: 'My Applications',
            icon: <List className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/applications`,
          },
          {
            label: 'My Interests',
            icon: <Heart className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/interests`,
          },
          {
            label: 'Find Exhibitions',
            icon: <Search className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/find`,
          }
        ];
      
      case UserRole.ORGANISER.toLowerCase():
        return [
          ...commonItems,
          {
            label: 'Exhibitions',
            icon: <Calendar className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/exhibitions`,
          },
          {
            label: 'Create Exhibition',
            icon: <Plus className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/exhibitions/create`,
          },
          {
            label: 'Applications',
            icon: <ClipboardList className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/applications`,
          },
          {
            label: 'Interest Inquiries',
            icon: <Users className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/interest-inquiries`,
          },
          {
            label: 'Coupons',
            icon: <Ticket className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/coupons`,
          }
        ];
      
      case UserRole.MANAGER.toLowerCase():
        return [
          ...commonItems,
          {
            label: 'Exhibitions',
            icon: <Calendar className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/exhibitions`,
          },
          {
            label: 'Categories',
            icon: <Tags className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/categories`,
          },
          {
            label: 'Venue Types',
            icon: <Building2 className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/venue-types`,
          },
          {
            label: 'Users',
            icon: <Users className="mr-2 h-4 w-4" />,
            path: `${dashboardPath}/users`,
          }
        ];
      
      default:
        return commonItems;
    }
  };

  if (!user) return null;

  const menuItems = getMenuItems();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-exhibae-navy focus:ring-opacity-50">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
            <AvatarFallback className="bg-exhibae-navy text-white">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex items-center">
            <span className="text-sm font-medium mr-1 max-w-[120px] truncate">{userName}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 flex flex-col">
          <span className="text-sm font-semibold">{user.user_metadata?.full_name || 'User'}</span>
          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          {userRole && (
            <span className="text-xs mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full w-fit capitalize">
              {userRole}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link to={item.path} className="flex items-center cursor-pointer">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown; 