import React, { useState } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface NewSlider {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
}

const STORAGE_BUCKET = 'sliders';

const CreateSlider = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [slider, setSlider] = useState<NewSlider>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      setSlider({ ...slider, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!slider.image_url) {
        toast.error('Image is required');
        return;
      }

      // Get the current highest order_index
      const { data: existingSliders } = await supabase
        .from('hero_sliders')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSliders?.[0]?.order_index 
        ? existingSliders[0].order_index + 1 
        : 1;

      const { error } = await supabase
        .from('hero_sliders')
        .insert([{ ...slider, order_index: nextOrderIndex }]);

      if (error) throw error;

      toast.success('Slider created successfully');
      navigate('/dashboard/manager/sliders');
    } catch (error: any) {
      console.error('Error creating slider:', error);
      toast.error(error.message || 'Failed to create slider');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/manager/sliders')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Create New Slider</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={slider.title}
                    onChange={(e) => setSlider({ ...slider, title: e.target.value })}
                    placeholder="Enter slider title"
                  />
                </div>
                <div>
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    value={slider.link_url}
                    onChange={(e) => setSlider({ ...slider, link_url: e.target.value })}
                    placeholder="Enter link URL"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={slider.description}
                    onChange={(e) => setSlider({ ...slider, description: e.target.value })}
                    placeholder="Enter slider description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={slider.is_active}
                    onCheckedChange={(checked) => setSlider({ ...slider, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                  />
                  {uploading && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  )}
                </div>
                {slider.image_url && (
                  <div className="mt-4">
                    <Label>Preview</Label>
                    <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border">
                      <img
                        src={slider.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/manager/sliders')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                Create Slider
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSlider; 