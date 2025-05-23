import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { UserRole } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const getDashboardPath = (role: string) => {
  switch (role.toLowerCase()) {
    case UserRole.ORGANISER.toLowerCase():
      return '/dashboard/organiser';
    case UserRole.BRAND.toLowerCase():
      return '/dashboard/brand';
    case UserRole.SHOPPER.toLowerCase():
      return '/dashboard/shopper';
    default:
      return '/exhibitions';
  }
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already logged in
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (user) {
        // First check user metadata
        const metadataRole = user.user_metadata?.role;
        if (metadataRole) {
          navigate(getDashboardPath(metadataRole));
          return;
        }

        // Fallback to profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileData?.role) {
          navigate(getDashboardPath(profileData.role));
        }
      }
    };

    checkUserAndRedirect();
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        // First check user metadata for role
        const metadataRole = authData.user.user_metadata?.role;
        
        if (metadataRole === 'manager') {
          await supabase.auth.signOut();
          throw new Error('Please use the manager login page.');
        }

        let userRole = metadataRole;

        // If no role in metadata, check profiles table
        if (!userRole) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;
          if (!profileData) throw new Error('No profile found');
          
          userRole = profileData.role;
        }

        if (!userRole) {
          throw new Error('No role assigned to user');
        }

        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });

        // If we have a stored location, redirect there, otherwise go to role-based dashboard
        const from = (location.state as any)?.from?.pathname || getDashboardPath(userRole);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log in. Please try again.",
        variant: "destructive",
      });

      // Sign out if there was an error
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-600 hover:text-exhibae-navy"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-exhibae-navy hover:bg-opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-exhibae-navy hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
