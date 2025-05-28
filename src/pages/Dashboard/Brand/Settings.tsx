import React, { useState, useEffect } from 'react';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, FileText, X, Trash2, MoreHorizontal, Loader2, Image as ImageIcon } from 'lucide-react';
import { FileUpload } from '@/components/brand/FileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBrandProfile } from '@/hooks/useBrandProfile';

interface LookBookItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  created_at: string;
}

interface LookBook {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile, isLoading: isProfileLoading, error: profileError, refetch } = useBrandProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    full_name: '',
    phone: '',
    website_url: '',
    description: '',
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    logo_url: '',
    cover_image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [lookBooks, setLookBooks] = useState<LookBook[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedLookBookFiles, setSelectedLookBookFiles] = useState<File[]>([]);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [uploadingLookBook, setUploadingLookBook] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [lookBookTitle, setLookBookTitle] = useState('');
  const [lookBookDescription, setLookBookDescription] = useState('');
  const [editingLookBook, setEditingLookBook] = useState<LookBook | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [isAddingLookBook, setIsAddingLookBook] = useState(false);
  const [isAddingGallery, setIsAddingGallery] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBrandAssets();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        full_name: user?.user_metadata?.full_name || '',
        phone: profile.contact_phone || '',
        website_url: profile.website || '',
        description: profile.description || '',
        instagram_url: profile.instagram_url || '',
        facebook_url: profile.facebook_url || '',
        twitter_url: profile.twitter_url || '',
        linkedin_url: profile.linkedin_url || '',
        logo_url: profile.logo_url || '',
        cover_image_url: profile.cover_image_url || ''
      });
    }
  }, [profile, user]);

  const fetchBrandAssets = async () => {
    try {
      setLoading(true);

      // Fetch look books
      const { data: lookBooksData, error: lookBooksError } = await supabase
        .from('brand_lookbooks')
        .select('*')
        .eq('brand_id', user?.id)
        .order('created_at', { ascending: false });

      if (lookBooksError) throw lookBooksError;
      setLookBooks(lookBooksData || []);

      // Fetch gallery
      const { data: galleryData, error: galleryError } = await supabase
        .from('brand_gallery')
        .select('*')
        .eq('brand_id', user?.id)
        .order('created_at', { ascending: false });

      if (galleryError) throw galleryError;
      setGallery(galleryData || []);

    } catch (error) {
      console.error('Error fetching brand assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch brand assets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (file: File | null, type: 'logo' | 'cover') => {
    if (!user || !profile) return;

    try {
      setIsUploading(true);
      
      if (file === null) {
        // Handle image removal
        setFormData(prev => ({
          ...prev,
          [type === 'logo' ? 'logo_url' : 'cover_image_url']: ''
        }));

        // Update profile in database
        const { error } = await supabase
          .from('brand_profiles')
          .update({
            [type === 'logo' ? 'logo_url' : 'cover_image_url']: null
          })
          .eq('id', profile.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${type === 'logo' ? 'Logo' : 'Cover image'} removed successfully`,
        });

        refetch();
        return;
      }
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('brand_assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('brand_assets')
        .getPublicUrl(filePath);

      // Update form data with new URL
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'cover_image_url']: data.publicUrl
      }));

      // Update profile in database
      const { error: updateError } = await supabase
        .from('brand_profiles')
        .update({
          [type === 'logo' ? 'logo_url' : 'cover_image_url']: data.publicUrl
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Cover image'} uploaded successfully`,
      });

      refetch();

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: `Failed to ${file ? 'upload' : 'remove'} ${type === 'logo' ? 'logo' : 'cover image'}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      // Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          company_name: formData.company_name,
          full_name: formData.full_name,
          phone: formData.phone,
          website_url: formData.website_url,
          description: formData.description
        }
      });

      if (userError) throw userError;

      const profileData = {
        company_name: formData.company_name,
        description: formData.description,
        website: formData.website_url,
        contact_phone: formData.phone,
        contact_email: user.email || '',
        logo_url: formData.logo_url,
        cover_image_url: formData.cover_image_url,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        twitter_url: formData.twitter_url,
        linkedin_url: formData.linkedin_url
      };

      // Update existing profile
      const { error: profileError } = await supabase
        .from('brand_profiles')
        .update(profileData)
        .eq('id', profile.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLookBookUpload = async () => {
    if (!selectedLookBookFiles.length || !lookBookTitle) return;

    try {
      setUploadingLookBook(true);
      const file = selectedLookBookFiles[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/lookbooks/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand_assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // Explicitly set the content type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand_assets')
        .getPublicUrl(fileName);

      // Save look book details to database
      const { error: dbError } = await supabase
        .from('brand_lookbooks')
        .insert({
          brand_id: user?.id,
          title: lookBookTitle,
          description: lookBookDescription,
          file_url: publicUrl,
          file_type: file.type,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      toast({
        title: 'Success',
        description: 'Look book uploaded successfully',
      });

      // Reset form
      setSelectedLookBookFiles([]);
      setLookBookTitle('');
      setLookBookDescription('');
      fetchBrandAssets();

    } catch (error: any) {
      console.error('Error uploading look book:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload look book',
        variant: 'destructive',
      });
    } finally {
      setUploadingLookBook(false);
    }
  };

  const handleGalleryUpload = async () => {
    if (!selectedGalleryFiles.length) return;

    try {
      setUploadingGallery(true);
      const uploadPromises = selectedGalleryFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand_assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('brand_assets')
          .getPublicUrl(fileName);

        // Save gallery item to database
        return supabase
          .from('brand_gallery')
          .insert({
            brand_id: user?.id,
            image_url: publicUrl,
          });
      });

      await Promise.all(uploadPromises);

      toast({
        title: 'Success',
        description: 'Images uploaded to gallery successfully',
      });

      // Reset form and refresh data
      setSelectedGalleryFiles([]);
      fetchBrandAssets();

    } catch (error) {
      console.error('Error uploading to gallery:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images to gallery',
        variant: 'destructive',
      });
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteLookBook = async (id: string, fileUrl: string) => {
    try {
      // Extract the path from the URL
      const filePath = fileUrl.split('/').slice(-2).join('/');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand_assets')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('brand_lookbooks')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Look book deleted successfully',
      });

      fetchBrandAssets();
    } catch (error) {
      console.error('Error deleting look book:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete look book',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGalleryItem = async (id: string, imageUrl: string) => {
    try {
      // Delete from storage
      const filePath = imageUrl.split('/').slice(-2).join('/'); // Get path: userId/filename
      await supabase.storage
        .from('brand_assets')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('brand_gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Image deleted from gallery successfully',
      });

      fetchBrandAssets();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const handleEditLookBook = async () => {
    if (!editingLookBook) return;

    try {
      const { error } = await supabase
        .from('brand_lookbooks')
        .update({
          title: lookBookTitle,
          description: lookBookDescription,
        })
        .eq('id', editingLookBook.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Look book updated successfully',
      });

      setEditingLookBook(null);
      setLookBookTitle('');
      setLookBookDescription('');
      fetchBrandAssets();
    } catch (error) {
      console.error('Error updating look book:', error);
      toast({
        title: 'Error',
        description: 'Failed to update look book',
        variant: 'destructive',
      });
    }
  };

  const handleEditGalleryItem = async (id: string, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('brand_gallery')
        .update({
          title,
          description,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Gallery item updated successfully',
      });

      setEditingGalleryItem(null);
      fetchBrandAssets();
    } catch (error) {
      console.error('Error updating gallery item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update gallery item',
        variant: 'destructive',
      });
    }
  };

  return (
    <SettingsLayout basePath="/dashboard/brand/settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Manage your brand profile and preferences</p>
          </div>
        </div>

        {isProfileLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : profileError ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">Failed to load profile data</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
            <div className="border-b">
              <TabsList className="w-full h-12 bg-transparent p-0 flex justify-start gap-8">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent px-0 pb-4"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="lookbook"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent px-0 pb-4"
                >
                  Look Book
                </TabsTrigger>
                <TabsTrigger 
                  value="gallery"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent px-0 pb-4"
                >
                  Gallery
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Update your brand information and preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        {/* Brand Images Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Brand Images</h3>
                          
                          {/* Cover Image */}
                          <div className="space-y-2">
                            <Label>Cover Image</Label>
                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                              {formData.cover_image_url ? (
                                <>
                                  <img
                                    src={formData.cover_image_url}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleFileUpload(null, 'cover')}
                                      disabled={isUploading}
                                    >
                                      {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remove
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <FileUpload
                                    onFileSelect={(files) => handleFileUpload(files[0], 'cover')}
                                    acceptedFileTypes={['image/*']}
                                    maxFiles={1}
                                    selectedFiles={[]}
                                    onRemoveFile={() => {}}
                                  />
                                  <p className="text-xs text-gray-400 mt-1">Recommended size: 1200x300</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Logo Image */}
                          <div className="space-y-2">
                            <Label>Logo</Label>
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                              {formData.logo_url ? (
                                <>
                                  <img
                                    src={formData.logo_url}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleFileUpload(null, 'logo')}
                                      disabled={isUploading}
                                    >
                                      {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <FileUpload
                                    onFileSelect={(files) => handleFileUpload(files[0], 'logo')}
                                    acceptedFileTypes={['image/*']}
                                    maxFiles={1}
                                    selectedFiles={[]}
                                    onRemoveFile={() => {}}
                                  />
                                  <p className="text-xs text-gray-400 mt-1">Recommended size: 200x200, square format</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                              id="company_name"
                              name="company_name"
                              value={formData.company_name}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email (Cannot be changed)</Label>
                            <Input
                              id="email"
                              value={user?.email || ''}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                              id="website_url"
                              name="website_url"
                              value={formData.website_url}
                              onChange={handleInputChange}
                              placeholder="https://www.example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instagram_url">Instagram URL</Label>
                            <Input
                              id="instagram_url"
                              name="instagram_url"
                              value={formData.instagram_url}
                              onChange={handleInputChange}
                              placeholder="https://instagram.com/yourbrand"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="facebook_url">Facebook URL</Label>
                            <Input
                              id="facebook_url"
                              name="facebook_url"
                              value={formData.facebook_url}
                              onChange={handleInputChange}
                              placeholder="https://facebook.com/yourbrand"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Tell us about your brand..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* Brand Images Section */}
                      <div className="space-y-4">
                        <h3 className="font-medium mb-2">Brand Images</h3>
                        
                        {/* Cover Image */}
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Cover Image</span>
                          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                            {profile?.cover_image_url ? (
                              <img
                                src={profile.cover_image_url}
                                alt="Cover"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">No cover image</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Logo Image */}
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Logo</span>
                          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                            {profile?.logo_url ? (
                              <img
                                src={profile.logo_url}
                                alt="Logo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                <p className="text-xs text-gray-500 mt-1">No logo</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Business Information</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Company Name: </span>
                            <span className="text-sm">{profile?.company_name || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Full Name: </span>
                            <span className="text-sm">{user?.user_metadata?.full_name || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Email: </span>
                            <span className="text-sm">{user?.email} (Cannot be changed)</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Phone: </span>
                            <span className="text-sm">{profile?.contact_phone || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Website: </span>
                            <span className="text-sm">
                              {profile?.website ? (
                                <a 
                                  href={profile.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {profile.website}
                                </a>
                              ) : (
                                'Not provided'
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Social Media: </span>
                            <div className="flex gap-4 mt-1">
                              {profile?.instagram_url && (
                                <a 
                                  href={profile.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                  </svg>
                                  Instagram
                                </a>
                              )}
                              {profile?.facebook_url && (
                                <a 
                                  href={profile.facebook_url}
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
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">About</h3>
                        <p className="text-sm text-muted-foreground">
                          {profile?.description || 'No description provided'}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={() => setIsEditing(true)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lookbook" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Look Book</CardTitle>
                    <CardDescription>Upload PDF documents or images to showcase your brand</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddingLookBook(true)}>
                    Add Look Book
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : lookBooks.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No look books yet</h3>
                      <p className="text-sm text-gray-500 mb-4">Upload your first look book to showcase your brand</p>
                      <Button onClick={() => setIsAddingLookBook(true)}>
                        Add Look Book
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {lookBooks.map((lookBook) => (
                        <div
                          key={lookBook.id}
                          className="relative group rounded-lg border p-4 space-y-2 hover:shadow-md transition-shadow"
                        >
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a
                                    href={lookBook.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setEditingLookBook(lookBook);
                                  setLookBookTitle(lookBook.title);
                                  setLookBookDescription(lookBook.description || '');
                                }}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteLookBook(lookBook.id, lookBook.file_url)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="aspect-[3/4] rounded-md overflow-hidden bg-gray-100">
                            {lookBook.file_type.startsWith('image/') ? (
                              <img
                                src={lookBook.file_url}
                                alt={lookBook.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium truncate">{lookBook.title}</h5>
                            {lookBook.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {lookBook.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Look Book Dialog */}
              <Dialog open={isAddingLookBook} onOpenChange={setIsAddingLookBook}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Look Book</DialogTitle>
                    <DialogDescription>
                      Upload a PDF document or image to showcase your brand
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lookbook-title">Title</Label>
                      <Input
                        id="lookbook-title"
                        value={lookBookTitle}
                        onChange={(e) => setLookBookTitle(e.target.value)}
                        placeholder="Enter a title for your look book"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lookbook-description">Description (Optional)</Label>
                      <Textarea
                        id="lookbook-description"
                        value={lookBookDescription}
                        onChange={(e) => setLookBookDescription(e.target.value)}
                        placeholder="Add a description for your look book"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload File</Label>
                      <FileUpload
                        onFileSelect={(files) => setSelectedLookBookFiles(files)}
                        acceptedFileTypes={['image/*', 'application/pdf']}
                        maxFiles={1}
                        selectedFiles={selectedLookBookFiles}
                        onRemoveFile={() => setSelectedLookBookFiles([])}
                      />
                      <p className="text-xs text-gray-500">
                        Accepted formats: PDF, JPG, PNG (max 3MB)
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsAddingLookBook(false);
                        setLookBookTitle('');
                        setLookBookDescription('');
                        setSelectedLookBookFiles([]);
                      }}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          handleLookBookUpload();
                          setIsAddingLookBook(false);
                        }}
                        disabled={!selectedLookBookFiles.length || !lookBookTitle || uploadingLookBook}
                      >
                        {uploadingLookBook ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload Look Book'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Look Book Dialog */}
              <Dialog open={editingLookBook !== null} onOpenChange={(open) => !open && setEditingLookBook(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Look Book</DialogTitle>
                    <DialogDescription>
                      Update the look book details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-lookbook-title">Title</Label>
                      <Input
                        id="edit-lookbook-title"
                        value={lookBookTitle}
                        onChange={(e) => setLookBookTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lookbook-description">Description</Label>
                      <Textarea
                        id="edit-lookbook-description"
                        value={lookBookDescription}
                        onChange={(e) => setLookBookDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setEditingLookBook(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditLookBook}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gallery</CardTitle>
                    <CardDescription>Upload images to showcase your products and brand</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddingGallery(true)}>
                    Add Images
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : gallery.length === 0 ? (
                    <div className="text-center py-8">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No images yet</h3>
                      <p className="text-sm text-gray-500 mb-4">Add images to showcase your products and brand</p>
                      <Button onClick={() => setIsAddingGallery(true)}>
                        Add Images
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {gallery.map((item) => (
                        <div
                          key={item.id}
                          className="relative group aspect-square rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a
                                    href={item.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingGalleryItem(item)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteGalleryItem(item.id, item.image_url)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <img
                            src={item.image_url}
                            alt={item.title || `Gallery image ${item.id}`}
                            className="w-full h-full object-cover"
                          />
                          {(item.title || item.description) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                              {item.title && <h5 className="font-medium text-sm">{item.title}</h5>}
                              {item.description && <p className="text-xs line-clamp-2">{item.description}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Gallery Images Dialog */}
              <Dialog open={isAddingGallery} onOpenChange={setIsAddingGallery}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Gallery Images</DialogTitle>
                    <DialogDescription>
                      Upload images to showcase your products and brand
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Images</Label>
                      <FileUpload
                        onFileSelect={(files) => setSelectedGalleryFiles(files)}
                        acceptedFileTypes={['image/*']}
                        maxFiles={5}
                        selectedFiles={selectedGalleryFiles}
                        onRemoveFile={(index) => {
                          const newFiles = [...selectedGalleryFiles];
                          newFiles.splice(index, 1);
                          setSelectedGalleryFiles(newFiles);
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Upload up to 5 images (max 3MB each)
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsAddingGallery(false);
                        setSelectedGalleryFiles([]);
                      }}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          handleGalleryUpload();
                          setIsAddingGallery(false);
                        }}
                        disabled={!selectedGalleryFiles.length || uploadingGallery}
                      >
                        {uploadingGallery ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload Images'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Gallery Item Dialog */}
              <Dialog open={editingGalleryItem !== null} onOpenChange={(open) => !open && setEditingGalleryItem(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Gallery Item</DialogTitle>
                    <DialogDescription>
                      Update the image details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-gallery-title">Title</Label>
                      <Input
                        id="edit-gallery-title"
                        value={editingGalleryItem?.title || ''}
                        onChange={(e) => setEditingGalleryItem(prev => 
                          prev ? { ...prev, title: e.target.value } : null
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gallery-description">Description</Label>
                      <Textarea
                        id="edit-gallery-description"
                        value={editingGalleryItem?.description || ''}
                        onChange={(e) => setEditingGalleryItem(prev => 
                          prev ? { ...prev, description: e.target.value } : null
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setEditingGalleryItem(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        if (editingGalleryItem) {
                          handleEditGalleryItem(
                            editingGalleryItem.id,
                            editingGalleryItem.title || '',
                            editingGalleryItem.description || ''
                          );
                        }
                      }}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SettingsLayout>
  );
};

export default Settings; 