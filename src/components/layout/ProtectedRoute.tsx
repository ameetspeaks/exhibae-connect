import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode | ((props: { user: any; userRole: string | null }) => React.ReactNode);
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        // First check user_metadata for role
        const metadataRole = user.user_metadata?.role;
        if (metadataRole) {
          setUserRole(metadataRole);
          setRoleLoading(false);
          return;
        }

        // Fallback to profiles table if no role in metadata
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
        }
      }
      setRoleLoading(false);
    };

    fetchUserRole();
  }, [user]);

  // Show loading state while checking authentication and roles
  if (loading || roleLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-exhibae-navy"></div>
    </div>;
  }

  // If not authenticated, redirect to appropriate login page based on the attempted route
  if (!user) {
    if (location.pathname.startsWith('/dashboard/admin')) {
      return <Navigate to="/auth/admin/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/dashboard/manager')) {
      return <Navigate to="/auth/manager/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // For admin routes, check admin status
  if (location.pathname.startsWith('/dashboard/admin') && !isAdmin) {
    return <Navigate to="/auth/admin/login" replace />;
  }

  // For role-based routes, redirect to appropriate login page if role doesn't match
  if (allowedRoles && userRole && !allowedRoles.includes(userRole as UserRole)) {
    const roleToLoginMap = {
      [UserRole.MANAGER]: '/auth/manager/login',
      [UserRole.ORGANISER]: '/auth/login',
      [UserRole.BRAND]: '/auth/login',
      [UserRole.SHOPPER]: '/auth/login',
    };

    // Get the first required role and redirect to its login page
    const requiredRole = allowedRoles[0];
    const loginPath = roleToLoginMap[requiredRole] || '/auth/login';
    
    return <Navigate to={loginPath} replace />;
  }

  // Handle both render prop and direct children
  return typeof children === 'function' 
    ? <>{children({ user, userRole })}</>
    : <>{children}</>;
};

export default ProtectedRoute; 