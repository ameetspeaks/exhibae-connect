import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ArrowLeft, Smartphone, Monitor } from 'lucide-react';

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  mobile_image_url: string | null;
  desktop_image_url: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
  image_dimensions: {
    mobile: { width: number; height: number };
    desktop: { width: number; height: number };
  };
}

const EditSlider = () => {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [slider, setSlider] = useState<HeroSlider | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    mobile?: File;
    desktop?: File;
  }>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    is_active: true,
  });

  useEffect(() => {
    const fetchSlider = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_sliders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setSlider(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          link_url: data.link_url || '',
          is_active: data.is_active,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch slider',
          variant: 'destructive',
        });
        navigate('/dashboard/manager/sliders');
      } finally {
        setLoading(false);
      }
    };

    fetchSlider();
  }, [id, supabase, navigate, toast]);

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const updates: any = {
        title: formData.title,
        description: formData.description,
        link_url: formData.link_url || null,
        is_active: formData.is_active,
      };

      // Upload new images if selected
      if (selectedFiles.mobile) {
        const mobileFileName = `hero-sliders/${Date.now()}-mobile.${selectedFiles.mobile.name.split('.').pop()}`;
        const { error: mobileError } = await supabase.storage
          .from('public')
          .upload(mobileFileName, selectedFiles.mobile);

        if (mobileError) throw mobileError;
        updates.mobile_image_url = supabase.storage.from('public').getPublicUrl(mobileFileName).data.publicUrl;
      }

      if (selectedFiles.desktop) {
        const desktopFileName = `hero-sliders/${Date.now()}-desktop.${selectedFiles.desktop.name.split('.').pop()}`;
        const { error: desktopError } = await supabase.storage
          .from('public')
          .upload(desktopFileName, selectedFiles.desktop);

        if (desktopError) throw desktopError;
        updates.desktop_image_url = supabase.storage.from('public').getPublicUrl(desktopFileName).data.publicUrl;
      }

      // Update database
      const { error: updateError } = await supabase
        .from('hero_sliders')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Hero slider updated successfully',
      });

      navigate('/dashboard/manager/sliders');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update slider',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !slider) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
      <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle>Edit Hero Slider</CardTitle>
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
                <AspectRatio ratio={9/16} className="bg-muted rounded-lg overflow-hidden">
                  <img
                    src={slider.mobile_image_url || ''}
                    alt={`${slider.title} - mobile`}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
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
                <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden">
                      <img
                    src={slider.desktop_image_url || ''}
                    alt={`${slider.title} - desktop`}
                        className="w-full h-full object-cover"
                      />
                </AspectRatio>
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

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  id="is-active"
                />
                <Label htmlFor="is-active">Active</Label>
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
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Update Slider
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

export default EditSlider; 