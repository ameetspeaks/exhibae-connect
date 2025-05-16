import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import ManagerSideNav from './ManagerSideNav';
import DashboardHeader from './DashboardHeader';

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
    <div className="min-h-screen">
      <ManagerSideNav onLogout={handleLogout} />
      <div className="pl-64">
        <DashboardHeader />
        <main className="bg-gray-50 min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto py-8 px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout; 