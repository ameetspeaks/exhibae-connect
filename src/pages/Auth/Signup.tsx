import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  role: z.enum(['admin', 'organiser', 'brand', 'shopper']),
  company_name: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  
  const { control, handleSubmit, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      role: 'shopper',
      company_name: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    try {
      // Prepare metadata
      const metadata = {
        full_name: data.full_name.trim(),
        role: data.role,
        ...(data.role === 'brand' && data.company_name 
          ? { company_name: data.company_name.trim() } 
          : {})
      };

      // Attempt signup using AuthProvider
      const { user, error } = await signUp(data.email, data.password, metadata);

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      if (!user) {
        throw new Error('No user data returned from signup');
      }

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      });

      navigate('/auth/login');
    } catch (error: any) {
      console.error('Error during signup:', error);
      
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center bg-[#F5E4DA]/10">
      <Card className="w-[400px] border-[#4B1E25]/10">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input 
                      {...field}
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
                    />
                    {error && <p className="text-sm text-red-500">{error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input 
                      {...field}
                      type="password"
                      id="password"
                      placeholder="Enter your password"
                      className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
                    />
                    {error && <p className="text-sm text-red-500">{error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Controller
                name="full_name"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input 
                      {...field}
                      id="full_name"
                      placeholder="Enter your full name"
                      className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
                    />
                    {error && <p className="text-sm text-red-500">{error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shopper">Shopper</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                        <SelectItem value="organiser">Organiser</SelectItem>
                      </SelectContent>
                    </Select>
                    {error && <p className="text-sm text-red-500">{error.message}</p>}
                  </>
                )}
              />
            </div>

            {selectedRole === 'brand' && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Controller
                  name="company_name"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Input 
                        {...field}
                        id="company_name"
                        placeholder="Enter your company name"
                        className="border-[#4B1E25]/20 focus:border-[#4B1E25] focus:ring-[#4B1E25]"
                      />
                      {error && <p className="text-sm text-red-500">{error.message}</p>}
                    </>
                  )}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
              Sign Up
            </Button>
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-[#4B1E25] hover:text-[#4B1E25]/80">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
