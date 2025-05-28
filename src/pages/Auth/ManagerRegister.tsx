import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ManagerRegister = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Sign up the user with minimal metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'manager'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('Registration failed - no user data');
      }

      // Step 2: Create profile with the current session
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          company_name: companyName,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      toast({
        title: 'Registration Successful',
        description: 'Please check your email to verify your account.',
      });

      // Step 3: Sign out and redirect
      await supabase.auth.signOut();
      navigate('/auth/manager/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Error',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive',
      });

      // Attempt to clean up if there was an error
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Cleanup error:', signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5E4DA]/10">
      <Card className="w-full max-w-md border-[#4B1E25]/10">
        <CardHeader>
          <CardTitle>Manager Registration</CardTitle>
          <CardDescription>
            Create a manager account to access the exhibition management system
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
                placeholder="Enter your password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="fullName">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="companyName">
                Company Name
              </label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
              />
            </div>
            <Button type="submit" className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Button
                variant="link"
                className="p-0 h-auto text-[#4B1E25] hover:text-[#4B1E25]/80"
                onClick={() => navigate('/auth/manager/login')}
              >
                Login here
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerRegister; 