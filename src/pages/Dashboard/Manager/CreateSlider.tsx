import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ArrowLeft } from 'lucide-react';

const CreateSlider = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{
    mobile?: File;
    desktop?: File;
  }>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
  });
  const [previewUrls, setPreviewUrls] = useState<{
    mobile?: string;
    desktop?: string;
  }>({});

  const handleFileChange = (type: 'mobile' | 'desktop', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFiles(prev => ({ ...prev, [type]: file }));
      setPreviewUrls(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const getNextOrderIndex = async () => {
    const { data, error } = await supabase
      .from('hero_sliders')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].order_index + 1 : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFiles.mobile || !selectedFiles.desktop) {
      toast({
        title: 'Missing files',
        description: 'Please select both mobile and desktop images',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get next order index
      const nextOrderIndex = await getNextOrderIndex();

      // Upload mobile image
      const mobileFileName = `hero-sliders/${Date.now()}-mobile.${selectedFiles.mobile.name.split('.').pop()}`;
      const { error: mobileError } = await supabase.storage
        .from('sliders')
        .upload(mobileFileName, selectedFiles.mobile);

      if (mobileError) throw mobileError;

      // Upload desktop image
      const desktopFileName = `hero-sliders/${Date.now()}-desktop.${selectedFiles.desktop.name.split('.').pop()}`;
      const { error: desktopError } = await supabase.storage
        .from('sliders')
        .upload(desktopFileName, selectedFiles.desktop);

      if (desktopError) throw desktopError;

      // Get public URLs
      const mobileUrl = supabase.storage.from('sliders').getPublicUrl(mobileFileName).data.publicUrl;
      const desktopUrl = supabase.storage.from('sliders').getPublicUrl(desktopFileName).data.publicUrl;

      // Insert into database
      const { error: dbError } = await supabase
        .from('hero_sliders')
        .insert({
          title: formData.title,
          description: formData.description,
          link_url: formData.link_url || null,
          mobile_image_url: mobileUrl,
          desktop_image_url: desktopUrl,
          image_url: desktopUrl,
          order_index: nextOrderIndex,
          is_active: true,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Hero slider created successfully',
      });

      navigate('/dashboard/manager/sliders');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create slider',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <Button
              variant="ghost"
              className="mb-2"
              onClick={() => navigate('/dashboard/manager/sliders')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sliders
            </Button>
            <CardTitle>Create New Hero Slider</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Mobile Image (9:16)</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('mobile', e)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended size: 640x960px
                  </p>
                </div>
                {previewUrls.mobile && (
                  <AspectRatio ratio={9/16} className="bg-muted rounded-lg overflow-hidden">
                    <img
                      src={previewUrls.mobile}
                      alt="Mobile preview"
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Desktop Image (16:9)</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('desktop', e)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended size: 1920x1080px
                  </p>
                </div>
                {previewUrls.desktop && (
                  <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden">
                    <img
                      src={previewUrls.desktop}
                      alt="Desktop preview"
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter slider title"
                />
              </div>
              
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter slider description"
                />
              </div>
              
              <div>
                <Label>Link URL (optional)</Label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="Enter link URL"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/manager/sliders')}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !selectedFiles.mobile || !selectedFiles.desktop}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Create Slider
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSlider; 