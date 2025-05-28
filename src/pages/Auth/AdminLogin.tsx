import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, AlertCircle, Key } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@exhibae.com',
      password: 'admin123',
    }
  });

  const handleQuickLogin = async () => {
    setIsLoading(true);
    try {
      // Use predefined admin credentials
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: 'admin@exhibae.com',
        password: 'admin123',
      });

      if (error) throw error;

      if (authData.user) {
        // Verify admin role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profileData || profileData.role !== 'admin') {
          throw new Error('Unauthorized. This login is restricted to administrators only.');
        }

        toast({
          title: "Quick Admin Access Granted",
          description: "Welcome to the admin dashboard!",
        });
        
        navigate('/dashboard/admin');
      }
    } catch (error: any) {
      console.error('Quick login error:', error);
      toast({
        title: "Access Denied",
        description: error.message || "Quick login failed. Please try again or use the form below.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        // Verify admin role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profileData || profileData.role !== 'admin') {
          throw new Error('Unauthorized. This login is restricted to administrators only.');
        }

        toast({
          title: "Authentication Successful",
          description: "Welcome to the admin dashboard.",
        });
        
        navigate('/dashboard/admin');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Access Denied",
        description: error.message || "Invalid credentials or unauthorized access.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4B1E25] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-[#F5E4DA]/95 backdrop-blur-sm shadow-xl border-[#4B1E25]/10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-[#4B1E25]" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#4B1E25]">Administrator Access</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Secure login portal for system administrators
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Login Button */}
          <div className="space-y-2">
            <Button 
              type="button"
              className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA] flex items-center justify-center gap-2"
              onClick={handleQuickLogin}
              disabled={isLoading}
            >
              <Key className="h-4 w-4" />
              {isLoading ? 'Accessing...' : 'Quick Admin Access'}
            </Button>
            <p className="text-xs text-center text-gray-500">
              One-click login with predefined admin credentials
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#4B1E25]/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#F5E4DA] text-gray-500">Or use credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Administrator Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exhibae.com"
                  {...register('email')}
                  className="w-full border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
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
                  className="w-full border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Access Admin Dashboard'}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
          <p>This is a restricted access point for system administrators only.</p>
          <Link to="/login" className="text-[#4B1E25] hover:text-[#4B1E25]/80">
            Return to regular login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin; 