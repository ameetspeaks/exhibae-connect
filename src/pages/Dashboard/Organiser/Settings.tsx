import React, { useState, useRef, useEffect } from 'react';
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
import { Loader2, Pencil, Users, Calendar, Upload, X } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Profile } from '@/types/profile';
import { Database } from '@/types/database.types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const formSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  description: z.string().optional(),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebook_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  avatar_url: z.string().optional(),
  banner_url: z.string().optional(),
  portfolio_url: z.string().optional(),
  gallery_images: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = React.useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = React.useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = React.useState<File[]>([]);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [portfolioPreview, setPortfolioPreview] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  const portfolioInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
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
      banner_url: '',
      portfolio_url: '',
      gallery_images: [],
    },
  });

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfileData(data as Profile);
        form.reset(data as FormValues);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' | 'portfolio' | 'gallery') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'gallery') {
      // Validate each file
      const validFiles = Array.from(files).filter(file => {
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        if (!isValidSize) {
          toast({
            title: 'Error',
            description: `File ${file.name} is too large. Maximum size is 5MB.`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      });

      setGalleryFiles(prev => [...prev, ...validFiles]);

      // Create preview URLs for gallery images
      validFiles.forEach(file => {
        const preview = URL.createObjectURL(file);
        setProfileData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            gallery_images: [...(prev.gallery_images || []), preview],
          };
        });
      });
    } else {
      const file = files[0];
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File is too large. Maximum size is 5MB.',
          variant: 'destructive',
        });
        return;
      }

      const preview = URL.createObjectURL(file);

      switch (type) {
        case 'avatar':
          setAvatarFile(file);
          setAvatarPreview(preview);
          break;
        case 'banner':
          setBannerFile(file);
          setBannerPreview(preview);
          break;
        case 'portfolio':
          setPortfolioFile(file);
          setPortfolioPreview(preview);
          break;
      }
    }
  };

  const uploadFile = async (folder: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organiser-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organiser-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!profileData?.id) return;
    
    try {
      setIsLoading(true);

      // Upload new files if they exist
      const newAvatarUrl = avatarFile ? await uploadFile('avatars', avatarFile) : null;
      const newBannerUrl = bannerFile ? await uploadFile('banners', bannerFile) : null;
      const newPortfolioUrl = portfolioFile ? await uploadFile('portfolios', portfolioFile) : null;
      
      // Upload gallery files
      const newGalleryUrls = await Promise.all(
        galleryFiles.map(file => uploadFile('gallery', file))
      );

      // Update form data with new URLs
      const updateData = {
        ...data,
        avatar_url: newAvatarUrl || data.avatar_url,
        banner_url: newBannerUrl || data.banner_url,
        portfolio_url: newPortfolioUrl || data.portfolio_url,
        gallery_images: [
          ...(profileData.gallery_images || []),
          ...newGalleryUrls.filter(Boolean) as string[],
        ],
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData as Profile)
        .eq('id', profileData.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Reset file states
      setAvatarFile(null);
      setBannerFile(null);
      setPortfolioFile(null);
      setGalleryFiles([]);
      
      // Reset preview states
      setAvatarPreview(null);
      setBannerPreview(null);
      setPortfolioPreview(null);

      // Exit edit mode
      setIsEditing(false);

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeGalleryImage = async (index: number, imageUrl?: string) => {
    if (!profileData) return;

    // If it's a newly added file (not yet uploaded)
    if (!imageUrl) {
      setGalleryFiles(prev => prev.filter((_, i) => i !== index));
      setProfileData(prev => {
        if (!prev) return prev;
        const newGalleryImages = [...(prev.gallery_images || [])];
        newGalleryImages.splice(index, 1);
        return {
          ...prev,
          gallery_images: newGalleryImages,
        };
      });
      return;
    }

    // If it's an existing image
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('organiser-assets')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update profile data
      const newGalleryImages = [...(profileData.gallery_images || [])];
      newGalleryImages.splice(index, 1);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ gallery_images: newGalleryImages })
        .eq('id', profileData.id);

      if (updateError) throw updateError;

      setProfileData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          gallery_images: newGalleryImages,
        };
      });

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const removeImage = async (type: 'banner' | 'portfolio', imageUrl?: string) => {
    if (!profileData || !imageUrl) return;

    try {
      // Get the full path after the bucket name
      const bucketPath = imageUrl.split('organiser-assets/')[1];
      if (!bucketPath) {
        throw new Error('Invalid file path');
      }

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('organiser-assets')
        .remove([bucketPath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        throw new Error('Failed to delete image from storage');
      }

      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [type === 'banner' ? 'banner_url' : 'portfolio_url']: null
        })
        .eq('id', profileData.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to update profile');
      }

      // Update local state
      setProfileData(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (type === 'banner') {
          updated.banner_url = null;
        } else {
          updated.portfolio_url = null;
        }
        return updated;
      });

      // Clear preview and file state
      if (type === 'banner') {
        setBannerPreview(null);
        setBannerFile(null);
      } else {
        setPortfolioPreview(null);
        setPortfolioFile(null);
      }

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete image',
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your profile settings and preferences
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Upload Forms Section */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upload Images</h3>
                <div className="space-y-6">
                  {/* Banner Upload */}
                  <FormField
                    control={form.control}
                    name="banner_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner Image</FormLabel>
                        <div className="relative aspect-[3.2/1] w-full overflow-hidden rounded-lg border border-gray-200">
                          {(bannerPreview || profileData?.banner_url) ? (
                            <div className="relative h-full">
                              <img
                                src={bannerPreview || profileData?.banner_url}
                                alt="Banner"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => removeImage('banner', profileData?.banner_url)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => bannerInputRef.current?.click()}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-50">
                              <Upload className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'banner')}
                            ref={bannerInputRef}
                            className="hidden"
                          />
                          {!bannerPreview && !profileData?.banner_url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute bottom-2 right-2"
                              onClick={() => bannerInputRef.current?.click()}
                            >
                              Upload Banner
                            </Button>
                          )}
                        </div>
                        <FormDescription>
                          Recommended size: 1920x600px (3.2:1 aspect ratio). Maximum file size: 5MB
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Avatar Upload */}
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <div className="flex flex-col items-center">
                          <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={avatarPreview || profileData?.avatar_url || ''} />
                            <AvatarFallback className="text-xl font-semibold">
                              {profileData?.full_name?.charAt(0) || profileData?.company_name?.charAt(0) || 'O'}
                            </AvatarFallback>
                          </Avatar>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'avatar')}
                            ref={avatarInputRef}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            Change Logo
                          </Button>
                        </div>
                        <FormDescription>
                          Square image recommended. Maximum file size: 5MB
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Portfolio Upload */}
                  <FormField
                    control={form.control}
                    name="portfolio_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio Image</FormLabel>
                        <div className="relative aspect-[1.4/1] w-full overflow-hidden rounded-lg border border-gray-200">
                          {(portfolioPreview || profileData?.portfolio_url) ? (
                            <div className="relative h-full">
                              <img
                                src={portfolioPreview || profileData?.portfolio_url}
                                alt="Portfolio"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => removeImage('portfolio', profileData?.portfolio_url)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => portfolioInputRef.current?.click()}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-50">
                              <Upload className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'portfolio')}
                            ref={portfolioInputRef}
                            className="hidden"
                          />
                          {!portfolioPreview && !profileData?.portfolio_url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute bottom-2 right-2"
                              onClick={() => portfolioInputRef.current?.click()}
                            >
                              Upload Portfolio
                            </Button>
                          )}
                        </div>
                        <FormDescription>
                          Recommended size: 1400x1000px. Maximum file size: 5MB
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gallery Upload */}
                  <FormField
                    control={form.control}
                    name="gallery_images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gallery Images</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {/* Existing Images */}
                          {profileData?.gallery_images?.map((url, index) => (
                            <div key={url} className="relative aspect-[16/9]">
                              <img
                                src={url}
                                alt={`Gallery ${index + 1}`}
                                className="h-full w-full object-cover rounded-lg"
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => removeGalleryImage(index, url)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => galleryInputRef.current?.click()}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Upload Button */}
                          <div className="aspect-[16/9] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFileChange(e, 'gallery')}
                              ref={galleryInputRef}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => galleryInputRef.current?.click()}
                            >
                              Add Images
                            </Button>
                          </div>
                        </div>
                        <FormDescription>
                          Recommended size: 1920x1080px (16:9 aspect ratio). Maximum file size: 5MB per image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Profile Information Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Organiser Information</CardTitle>
                  <CardDescription>Your organiser profile details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
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
                            <Input {...field} />
                          </FormControl>
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
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
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
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <Button type="submit">Save Changes</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        form.reset(profileData || undefined);
                        setAvatarPreview(null);
                        setBannerPreview(null);
                        setPortfolioPreview(null);
                        setAvatarFile(null);
                        setBannerFile(null);
                        setPortfolioFile(null);
                        setGalleryFiles([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        ) : (
          <>
            {/* View Mode */}
            {/* Current Images Preview Section */}
            {(profileData?.banner_url || profileData?.avatar_url || profileData?.portfolio_url || (profileData?.gallery_images && profileData.gallery_images.length > 0)) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Current Images</h3>
                <div className="space-y-6">
                  {/* Banner Preview */}
                  {profileData?.banner_url && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Banner Image</h4>
                      <div className="relative aspect-[3.2/1] w-full overflow-hidden rounded-lg border border-gray-200">
                        <img
                          src={profileData.banner_url}
                          alt="Banner"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Logo/Avatar Preview */}
                  {profileData?.avatar_url && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Logo</h4>
                      <div className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-200">
                        <img
                          src={profileData.avatar_url}
                          alt="Logo"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Portfolio Preview */}
                  {profileData?.portfolio_url && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Portfolio Image</h4>
                      <div className="relative aspect-[1.4/1] max-w-2xl overflow-hidden rounded-lg border border-gray-200">
                        <img
                          src={profileData.portfolio_url}
                          alt="Portfolio"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Gallery Preview */}
                  {profileData?.gallery_images && profileData.gallery_images.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Gallery Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {profileData.gallery_images.map((image, index) => (
                          <div key={index} className="relative aspect-[16/9] overflow-hidden rounded-lg border border-gray-200">
                            <img
                              src={image}
                              alt={`Gallery ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Profile Information View */}
            <Card>
              <CardHeader>
                <CardTitle>Organiser Information</CardTitle>
                <CardDescription>Your organiser profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-sm font-medium text-gray-500">Phone</p>
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
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-base">{profileData?.description || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SettingsLayout>
  );
};

export default Settings; 