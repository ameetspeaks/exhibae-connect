import React from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const DashboardHeader = () => {
  const { user } = useAuth();
  const userInitials = user?.email ? getInitials(user.email) : '?';

  return (
    <header className="h-16 bg-white border-b">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-exhibae-navy">Manager Dashboard</h1>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-50"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 