import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  FileText,
  Settings,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface SideNavProps {
  onLogout: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role?.toLowerCase() || 'organiser';
  const userInitials = user?.email ? getInitials(user.email) : '?';

  let navItems = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      href: `/dashboard/${userRole}`,
      exact: true
    },
    {
      title: 'Exhibitions',
      icon: CalendarDays,
      href: `/dashboard/${userRole}/exhibitions`
    },
    {
      title: 'Create Exhibition',
      icon: PlusCircle,
      href: `/dashboard/${userRole}/exhibitions/create`
    },
    {
      title: 'Applications',
      icon: FileText,
      href: `/dashboard/${userRole}/applications`
    }
  ];
  
  if (userRole === 'organiser') {
    navItems.push({
      title: 'Messages',
      icon: MessageSquare,
      href: `/dashboard/${userRole}/messages`
    });
  }
  
  navItems.push({
    title: 'Settings',
    icon: Settings,
    href: `/dashboard/${userRole}/settings`
  });

  return (
    <nav className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center">
          <Logo preset="sidebar" />
        </Link>
      </div>

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
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
    </nav>
  );
};

export default SideNav; 