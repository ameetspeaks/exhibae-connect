import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

const STORAGE_BUCKET = 'sliders';

const EditSlider = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [slider, setSlider] = useState<HeroSlider | null>(null);

  useEffect(() => {
    const fetchSlider = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from('hero_sliders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setSlider(data);
      } catch (error) {
        console.error('Error fetching slider:', error);
        toast.error('Failed to load slider');
        navigate('/dashboard/manager/sliders');
      } finally {
        setLoading(false);
      }
    };

    fetchSlider();
  }, [id, navigate, supabase]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !slider) return;

      setUploading(true);

      // Delete old image if it exists
      if (slider.image_url) {
        const oldFileName = slider.image_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([oldFileName]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload new image
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
      if (!slider) return;

      const { error } = await supabase
        .from('hero_sliders')
        .update({
          title: slider.title,
          description: slider.description,
          image_url: slider.image_url,
          link_url: slider.link_url,
          is_active: slider.is_active,
        })
        .eq('id', slider.id);

      if (error) throw error;

      toast.success('Slider updated successfully');
      navigate('/dashboard/manager/sliders');
    } catch (error) {
      console.error('Error updating slider:', error);
      toast.error('Failed to update slider');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!slider) {
    return null;
  }

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
            <CardTitle>Edit Slider</CardTitle>
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
                    value={slider.title || ''}
                    onChange={(e) => setSlider({ ...slider, title: e.target.value })}
                    placeholder="Enter slider title"
                  />
                </div>
                <div>
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    value={slider.link_url || ''}
                    onChange={(e) => setSlider({ ...slider, link_url: e.target.value })}
                    placeholder="Enter link URL"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={slider.description || ''}
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
                    <Label>Current Image</Label>
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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSlider; 