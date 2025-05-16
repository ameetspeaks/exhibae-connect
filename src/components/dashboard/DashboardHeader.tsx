import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types/auth';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface DashboardHeaderProps {
  role: UserRole;
  title: string;
}

const DashboardHeader = ({ role, title }: DashboardHeaderProps) => {
  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-exhibae-navy">{title}</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-50"
            />
          </div>
          
          <NotificationDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
