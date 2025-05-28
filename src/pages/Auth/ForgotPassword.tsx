import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the site URL based on environment
      const siteUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080'
        : 'https://exhibae.com'; // Remove www to match DNS setup

      console.log("Using redirect URL:", `${siteUrl}/reset-password`);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Success',
        description: 'Check your email for the password reset link.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset password email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E4DA]/10 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-[#4B1E25]/10">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-green-600">
                Password reset instructions have been sent to your email.
              </p>
              <p className="text-sm text-gray-600">
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-sm text-[#4B1E25] hover:text-[#4B1E25]/80"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword; 