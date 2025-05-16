import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [profileData, setProfileData] = React.useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      company_name: '',
      email: '',
      phone: '',
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          const formData = {
            full_name: data.full_name || '',
            company_name: data.company_name || '',
            email: data.email || '',
            phone: data.phone || '',
          };
          setProfileData(formData);
          form.reset(formData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, form, toast]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData(data);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <SettingsLayout basePath="/dashboard/organiser/settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout basePath="/dashboard/organiser/settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-gray-600">Manage your organiser profile details</p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organiser Information</CardTitle>
            <CardDescription>Your organiser profile details</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your company name" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" type="email" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your contact email address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" type="tel" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your contact phone number (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-4">
                    <Button type="submit">Save Changes</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsEditing(false);
                      form.reset(profileData || undefined);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-base">{profileData?.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Company Name</p>
                  <p className="text-base">{profileData?.company_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{profileData?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-base">{profileData?.phone || '-'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default Settings; 