import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SideNavProps {
  onLogout: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      href: '/dashboard',
      exact: true
    },
    {
      title: 'Exhibitions',
      icon: CalendarDays,
      href: '/dashboard/exhibitions'
    },
    {
      title: 'Create Exhibition',
      icon: PlusCircle,
      href: '/dashboard/exhibitions/create'
    },
    {
      title: 'Applications',
      icon: FileText,
      href: '/dashboard/applications'
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/dashboard/settings'
    }
  ];

  return (
    <nav className="w-64 bg-white border-r h-screen fixed left-0 top-0 pt-16">
      <div className="flex flex-col h-full">
        <div className="flex-1 py-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-exhibae-navy text-white"
                        : "text-gray-600 hover:text-exhibae-navy hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-exhibae-navy hover:bg-gray-50"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default SideNav; 