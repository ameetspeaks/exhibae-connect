import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  Ruler,
  MessageSquare,
  Settings,
  LogOut,
  Tag,Coupon Details

  FileText,
  Calendar,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Logo } from '@/components/ui/logo';

interface ManagerSideNavProps {
  onLogout: () => void;
}

const ManagerSideNav: React.FC<ManagerSideNavProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      href: '/dashboard/manager',
      exact: true
    },
    {
      title: 'Event Types',
      icon: Calendar,
      href: '/dashboard/manager/events'
    },
    {
      title: 'Exhibitions',
      icon: CalendarDays,
      href: '/dashboard/manager/exhibitions'
    },
    {
      title: 'Applications',
      icon: FileText,
      href: '/dashboard/manager/applications'
    },
    {
      title: 'Categories',
      icon: Tag,
      href: '/dashboard/manager/categories'
    },
    {
      title: 'Venue Types',
      icon: Building2,
      href: '/dashboard/manager/venue-types'
    },
    {
      title: 'Measurement Units',
      icon: Ruler,
      href: '/dashboard/manager/measurement-units'
    },
    {
      title: 'Coupons',
      icon: Ticket,
      href: '/dashboard/manager/coupons'
    },
    {
      title: 'Users',
      icon: Users,
      href: '/dashboard/manager/users'
    },
    {
      title: 'Support Chat',
      icon: MessageSquare,
      href: '/dashboard/manager/chat'
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/dashboard/manager/settings'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r fixed inset-y-0 flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center">
          <Logo preset="sidebar" />
        </Link>
      </div>
      
      <nav className="flex-1 px-4 pb-4 overflow-y-auto">
        <ul className="space-y-1">
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
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-exhibae-navy rounded-full flex items-center justify-center text-white">
            M
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Manager Account</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 hover:text-exhibae-navy hover:bg-gray-50"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default ManagerSideNav; 