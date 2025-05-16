import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Bell, User, Shield, Wallet } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/AuthProvider';

interface SettingsLayoutProps {
  children: React.ReactNode;
  basePath: string;
}

const SettingsLayout = ({ children, basePath }: SettingsLayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role?.toLowerCase() || '';

  const getSettingsNavItems = () => {
    const baseItems = [
      {
        title: 'Profile',
        icon: User,
        href: `${basePath}`,
        exact: true
      },
      {
        title: 'Notifications',
        icon: Bell,
        href: `${basePath}/notifications`
      }
    ];

    // Add Payment Details for organiser role only
    if (userRole === 'organiser') {
      baseItems.splice(1, 0, {
        title: 'Payment Details',
        icon: Wallet,
        href: `${basePath}/payment`
      });
    }

    return baseItems;
  };

  const settingsNavItems = getSettingsNavItems();

  return (
    <div className="flex gap-6">
      <aside className="w-64">
        <nav className="space-y-2">
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? currentPath === item.href
              : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
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
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout; 