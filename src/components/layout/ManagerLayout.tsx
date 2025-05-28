import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import ManagerSideNav from './ManagerSideNav';
import DashboardHeader from './DashboardHeader';
import { cn } from '@/lib/utils';

const ManagerLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

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

  return (
    <div className="flex h-screen overflow-hidden">
      <ManagerSideNav onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-auto bg-gradient-to-br from-indigo-50 to-slate-100">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className={cn(
              "rounded-lg",
              "bg-white",
              "shadow-md",
              "border",
              "border-indigo-100"
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

export default ManagerLayout; 