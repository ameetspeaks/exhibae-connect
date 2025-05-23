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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  description: z.string().optional(),
  website_url: z.string().url('Please enter a valid URL').or(z.string().length(0)).optional(),
  facebook_url: z.string().url('Please enter a valid URL').or(z.string().length(0)).optional(),
  avatar_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [profileData, setProfileData] = React.useState<FormData & { followers_count?: number, attendees_hosted?: number } | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      company_name: '',
      email: '',
      phone: '',
      description: '',
      website_url: '',
      facebook_url: '',
      avatar_url: '',
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
            description: data.description || '',
            website_url: data.website_url || '',
            facebook_url: data.facebook_url || '',
            avatar_url: data.avatar_url || '',
            followers_count: data.followers_count || 0,
            attendees_hosted: data.attendees_hosted || 0,
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      let avatarUrl = data.avatar_url;
      
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      // Get the attendees_hosted value from the form if editing
      const attendeesHosted = isEditing ? 
        Number((document.getElementById('attendees-hosted-input') as HTMLInputElement)?.value || profileData?.attendees_hosted || 0) : 
        profileData?.attendees_hosted || 0;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          description: data.description,
          website_url: data.website_url,
          facebook_url: data.facebook_url,
          avatar_url: avatarUrl,
          attendees_hosted: attendeesHosted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData({
        ...data,
        avatar_url: avatarUrl,
        followers_count: profileData?.followers_count,
        attendees_hosted: attendeesHosted,
      });
      setIsEditing(false);
      setAvatarFile(null);
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

        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>This is how others will see your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData?.avatar_url || ''} />
                  <AvatarFallback className="text-xl font-semibold">
                    {profileData?.full_name?.charAt(0) || profileData?.company_name?.charAt(0) || 'O'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex gap-6 text-sm mt-2">
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{profileData?.attendees_hosted || 0}</span>
                    <span className="text-muted-foreground">Attendees</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{profileData?.full_name}</h3>
                  <p className="text-gray-500">{profileData?.company_name}</p>
                </div>
                
                <p className="text-sm text-gray-600">
                  {profileData?.description || 'No description provided'}
                </p>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  {profileData?.website_url && (
                    <a 
                      href={profileData.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      Website
                    </a>
                  )}
                  
                  {profileData?.facebook_url && (
                    <a 
                      href={profileData.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Organiser Information</CardTitle>
            <CardDescription>Your organiser profile details</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={avatarPreview || profileData?.avatar_url || ''} />
                      <AvatarFallback className="text-xl font-semibold">
                        {profileData?.full_name?.charAt(0) || profileData?.company_name?.charAt(0) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Avatar
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell visitors about your organization..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of your organization that will be displayed on your profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="website_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://your-website.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your organization's website (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="facebook_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/your-page" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your organization's Facebook page (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="form-item">
                    <FormLabel>Attendees</FormLabel>
                    <FormControl>
                      <Input 
                        id="attendees-hosted-input"
                        placeholder="Attendees count" 
                        type="number" 
                        defaultValue={profileData?.attendees_hosted || 0} 
                      />
                    </FormControl>
                    <FormDescription>
                      Total number of attendees hosted at your exhibitions
                    </FormDescription>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button type="submit">Save Changes</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsEditing(false);
                      form.reset(profileData || undefined);
                      setAvatarPreview(null);
                      setAvatarFile(null);
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
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-base">{profileData?.description || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{profileData?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-base">{profileData?.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Website</p>
                  <p className="text-base">
                    {profileData?.website_url ? (
                      <a 
                        href={profileData.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profileData.website_url}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Facebook</p>
                  <p className="text-base">
                    {profileData?.facebook_url ? (
                      <a 
                        href={profileData.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profileData.facebook_url}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Attendees Hosted</p>
                  <p className="text-base">{profileData?.attendees_hosted || 0}</p>
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