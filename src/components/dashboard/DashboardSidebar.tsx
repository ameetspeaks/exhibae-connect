import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
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
  Tags
} from 'lucide-react';

interface DashboardSidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const DashboardSidebar = ({ role, onLogout }: DashboardSidebarProps) => {
  const location = useLocation();
  const path = location.pathname;

  // Define navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      {
        name: 'Overview',
        path: `/dashboard/${role.toLowerCase()}`,
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        name: 'Settings',
        path: `/dashboard/${role.toLowerCase()}/settings`,
        icon: <Settings className="w-5 h-5" />,
      },
    ];

    switch (role) {
      case UserRole.MANAGER:
        return [
          ...baseItems,
          {
            name: 'Categories',
            path: `/dashboard/${role.toLowerCase()}/categories`,
            icon: <Tags className="w-5 h-5" />,
          },
          {
            name: 'Venue Types',
            path: `/dashboard/${role.toLowerCase()}/venue-types`,
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            name: 'Measurement Units',
            path: `/dashboard/${role.toLowerCase()}/measurement-units`,
            icon: <Ruler className="w-5 h-5" />,
          },
          {
            name: 'Users',
            path: `/dashboard/${role.toLowerCase()}/users`,
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: 'Exhibitions',
            path: `/dashboard/${role.toLowerCase()}/exhibitions`,
            icon: <Calendar className="w-5 h-5" />,
          },
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
            name: 'Settings',
            path: `/dashboard/${role.toLowerCase()}/settings`,
            icon: <Settings className="w-5 h-5" />,
          },
        ];
      case UserRole.BRAND:
        return [
          ...baseItems,
          {
            name: 'My Applications',
            path: `/dashboard/${role.toLowerCase()}/applications`,
            icon: <List className="w-5 h-5" />,
          },
          {
            name: 'Find Exhibitions',
            path: `/dashboard/${role.toLowerCase()}/find`,
            icon: <Search className="w-5 h-5" />,
          },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <div className="h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-exhibae-navy">Exhi<span className="text-exhibae-coral">Bae</span></span>
        </Link>
      </div>
      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={path === item.path ? 'default' : 'ghost'}
              className={`w-full justify-start ${path === item.path ? 'bg-exhibae-navy text-white' : 'text-gray-600 hover:text-exhibae-navy hover:bg-gray-100'}`}
              asChild
            >
              <Link to={item.path} className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </Button>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-exhibae-navy rounded-full flex items-center justify-center text-white">
              {role === UserRole.ORGANISER && "O"}
              {role === UserRole.BRAND && "B"}
              {role === UserRole.ADMIN && "A"}
              {role === UserRole.SHOPPER && "S"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{role.charAt(0) + role.slice(1).toLowerCase()} Account</p>
              <p className="text-xs text-gray-500">user@example.com</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-exhibae-navy hover:bg-gray-100"
            onClick={onLogout}
          >
            <span className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
