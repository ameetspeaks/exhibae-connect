import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types/auth';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import ProfileDropdown from '../layout/ProfileDropdown';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  role: UserRole;
  title: string;
}

const DashboardHeader = ({ role, title }: DashboardHeaderProps) => {
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
      case UserRole.SHOPPER:
        return {
          primary: 'bg-exhibae-navy',
          hover: 'hover:bg-blue-800',
          light: 'bg-blue-50',
          text: 'text-exhibae-navy',
          border: 'border-blue-200'
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

  return (
    <div className={cn("border-b border-gray-200 bg-white p-4", colorScheme.border)}>
      <div className="flex items-center justify-between">
        <h1 className={cn("text-2xl font-semibold", colorScheme.text)}>{title}</h1>
        
        <div className="flex items-center space-x-4">
          {role !== UserRole.BRAND && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64 bg-gray-50"
              />
            </div>
          )}
          
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
