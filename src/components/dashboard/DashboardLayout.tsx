import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  role: UserRole;
  title: string;
}

const DashboardLayout = ({ role, title }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Define role-specific color schemes and styling
  const getRoleStyle = () => {
    switch (role) {
      case UserRole.MANAGER:
        return {
          bgGradient: 'bg-gradient-to-br from-indigo-50 to-slate-100',
          contentBg: 'bg-white',
          shadow: 'shadow-md',
          border: 'border-indigo-100',
          accent: 'border-l-4 border-l-indigo-500'
        };
      case UserRole.ORGANISER:
        return {
          bgGradient: 'bg-gradient-to-br from-emerald-50 to-slate-100',
          contentBg: 'bg-white',
          shadow: 'shadow-md',
          border: 'border-emerald-100',
          accent: 'border-l-4 border-l-emerald-500'
        };
      case UserRole.BRAND:
        return {
          bgGradient: 'bg-gradient-to-br from-amber-50 to-slate-100',
          contentBg: 'bg-white',
          shadow: 'shadow-md',
          border: 'border-amber-100',
          accent: 'border-l-4 border-l-amber-500'
        };
      case UserRole.SHOPPER:
        return {
          bgGradient: 'bg-gradient-to-br from-blue-50 to-slate-100',
          contentBg: 'bg-white',
          shadow: 'shadow-md',
          border: 'border-blue-100',
          accent: 'border-l-4 border-l-exhibae-navy'
        };
      default:
        return {
          bgGradient: 'bg-gradient-to-br from-blue-50 to-slate-100',
          contentBg: 'bg-white',
          shadow: 'shadow-md',
          border: 'border-blue-100',
          accent: 'border-l-4 border-l-blue-500'
        };
    }
  };

  const roleStyle = getRoleStyle();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar role={role} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader role={role} title={title} />
        <div className={cn("flex-1 overflow-auto", roleStyle.bgGradient)}>
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <DashboardBreadcrumb role={role} />
            <div className={cn(
              "rounded-lg", 
              roleStyle.contentBg, 
              roleStyle.shadow,
              "border",
              roleStyle.border
            )}>
              <div className="p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
