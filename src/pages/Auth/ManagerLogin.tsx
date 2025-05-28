import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';

const ManagerLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in as manager
  useEffect(() => {
    if (user?.user_metadata?.role === 'manager') {
      navigate('/dashboard/manager');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        // Check user metadata for role
        const role = user.user_metadata?.role;
        
        if (role !== 'manager') {
          // Sign out if not a manager
          await supabase.auth.signOut();
          throw new Error('Access denied. This login is for managers only.');
        }

        // If we have a stored location, redirect there, otherwise go to dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard/manager';
        
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });

        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: 'Login Error',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });

      // Sign out if there was an error
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5E4DA]/10">
      <Card className="w-full max-w-md border-[#4B1E25]/10">
        <CardHeader>
          <CardTitle>Manager Login</CardTitle>
          <CardDescription>
            Sign in to access the exhibition management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
              />
            </div>
            <Button type="submit" className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button
                variant="link"
                className="p-0 h-auto text-[#4B1E25] hover:text-[#4B1E25]/80"
                onClick={() => navigate('/auth/manager/register')}
              >
                Register here
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerLogin; 