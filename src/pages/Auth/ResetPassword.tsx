import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have a valid access token
  useEffect(() => {
    const checkForToken = async () => {
      try {
        console.log("Current URL:", window.location.href);
        
        // First check for hash params (standard format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        let accessToken = hashParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token');
        let type = hashParams.get('type');
        
        console.log("Hash params:", { accessToken: !!accessToken, type });
        
        // If no token in hash, check query params (alternate format)
        if (!accessToken) {
          const queryParams = new URLSearchParams(window.location.search);
          accessToken = queryParams.get('access_token');
          refreshToken = queryParams.get('refresh_token');
          type = queryParams.get('type');
          console.log("Query params:", { accessToken: !!accessToken, type });
        }
        
        // Also try to get from supabase auth
        if (!accessToken) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
            console.log("Got token from session");
          }
        }

        // Handle both direct access and callback URLs
        if (!accessToken && !window.location.hash && !window.location.search) {
          console.log("No token found, but user might be accessing directly - not redirecting yet");
          setTokenChecked(true);
          return;
        }

        if (!accessToken) {
          console.error("No access token found in URL or session");
          setTokenError("No access token found. Please request a new password reset.");
          setTokenChecked(true);
          return;
        }

        // Validate token is for recovery
        if (type && type !== 'recovery') {
          console.error("Token is not for recovery:", type);
          setTokenError("Invalid reset link. Please request a new password reset.");
          setTokenChecked(true);
          return;
        }

        // Token looks valid
        console.log("Token validated successfully");
        setTokenChecked(true);
      } catch (err) {
        console.error("Error checking token:", err);
        setTokenError("Error verifying your reset link. Please try again.");
        setTokenChecked(true);
      }
    };

    checkForToken();
  }, [location, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log("Starting password reset...");
      
      // Get the access token from URL hash params or query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      let accessToken = hashParams.get('access_token');
      let refreshToken = hashParams.get('refresh_token');
      
      // Try query params if not in hash
      if (!accessToken) {
        accessToken = queryParams.get('access_token');
        refreshToken = queryParams.get('refresh_token');
      }
      
      // Try to get from session if still not found
      if (!accessToken) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          accessToken = data.session.access_token;
          refreshToken = data.session.refresh_token;
        }
      }

      console.log("Access token found:", !!accessToken);

      if (!accessToken) {
        throw new Error('No access token found. Please try resetting your password again.');
      }

      // Set the access token in the session
      if (refreshToken) {
        console.log("Setting session with refresh token");
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        console.log("Session set successfully:", !!data.session);
      }

      // Update the password
      console.log("Updating password...");
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error("Update user error:", error);
        throw error;
      }

      console.log("Password updated successfully");
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully.',
      });

      // Sign out after password reset to ensure clean state
      await supabase.auth.signOut();

      // Redirect to login page after successful password reset
      navigate('/auth/login');
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
      navigate('/forgot-password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (!tokenChecked) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Verifying your reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenError) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset Link Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-red-600">{tokenError}</p>
              <Button 
                className="w-full"
                onClick={() => navigate('/forgot-password')}
              >
                Request New Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-exhibae-navy hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword; 