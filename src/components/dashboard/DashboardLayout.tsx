import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNotificationEvents } from '@/hooks/useNotificationEvents';
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
  const isShopperRole = role === UserRole.SHOPPER;

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

  // Initialize notification events
  useNotificationEvents();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        navigate('/auth/login');
        return;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If no profile exists, create one with the role from user metadata
      if (profileError && profileError.code === 'PGRST116') {
        const userRole = user.user_metadata?.role || role.toLowerCase();
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast({
            title: "Error",
            description: "Failed to create user profile. Please try again.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        // Check if the created profile role matches the expected role
        if (userRole !== role.toLowerCase()) {
          navigate('/');
          return;
        }
      } else if (profileError) {
        console.error('Error checking profile:', profileError);
        navigate('/');
        return;
      } else if (profile && profile.role !== role.toLowerCase()) {
        // If profile exists but role doesn't match
        navigate('/');
        return;
      }
    };

    checkUserRole();
  }, [user, role, navigate, toast]);

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

  // For shoppers, use a different layout without the sidebar
  if (isShopperRole) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader role={role} title={title} />
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  // For other roles, use the standard layout with sidebar
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
