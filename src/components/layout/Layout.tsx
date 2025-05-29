import React from 'react';
import Header from './Header';
import Footer from './Footer';
import WhatsAppSupport from '@/components/WhatsAppSupport';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Check if current route is a dashboard route
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleSignUp = () => {
    navigate('/auth/register');
  };

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
    <div className="flex flex-col min-h-screen">
      {!isDashboardRoute && (
        <Header 
          isAuthenticated={!!user}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          onLogout={handleLogout}
        />
      )}
      <main className={`flex-grow ${!isDashboardRoute ? 'min-h-[calc(100vh-64px)]' : 'min-h-screen'}`}>
        <Outlet />
      </main>
      {!isDashboardRoute && <Footer />}
      <WhatsAppSupport />
    </div>
  );
};

export default Layout;
