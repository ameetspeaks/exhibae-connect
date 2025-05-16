import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import SideNav from './SideNav';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = () => {
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
    <div className="min-h-screen bg-gray-50">
      <SideNav onLogout={handleLogout} />
      <DashboardHeader />
      <main className="pl-64 pt-16 min-h-screen">
        <div className="container mx-auto py-8 px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 