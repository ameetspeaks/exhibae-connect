import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Upload, Pencil, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

const SliderPage = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newSlider, setNewSlider] = useState<Partial<HeroSlider>>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
  });

  const fetchSliders = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_sliders')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setSliders(data || []);
    } catch (error) {
      console.error('Error fetching sliders:', error);
      toast.error('Failed to load sliders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, sliderId?: string) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `slider-images/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      if (sliderId) {
        // Update existing slider
        await handleUpdateSlider(sliderId, { image_url: publicUrl });
      } else {
        // Set URL for new slider
        setNewSlider({ ...newSlider, image_url: publicUrl });
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSlider = async () => {
    try {
      if (!newSlider.image_url) {
        toast.error('Image URL is required');
        return;
      }

      const { data, error } = await supabase
        .from('hero_sliders')
        .insert([
          {
            ...newSlider,
            order_index: sliders.length + 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSliders([...sliders, data]);
      setNewSlider({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        is_active: true,
      });
      toast.success('Slider added successfully');
    } catch (error) {
      console.error('Error adding slider:', error);
      toast.error('Failed to add slider');
    }
  };

  const handleUpdateSlider = async (id: string, updates: Partial<HeroSlider>) => {
    try {
      const { error } = await supabase
        .from('hero_sliders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setSliders(sliders.map(slider => 
        slider.id === id ? { ...slider, ...updates } : slider
      ));
      toast.success('Slider updated successfully');
    } catch (error) {
      console.error('Error updating slider:', error);
      toast.error('Failed to update slider');
    }
  };

  const handleDeleteSlider = async (id: string) => {
    try {
      const slider = sliders.find(s => s.id === id);
      if (slider?.image_url) {
        // Extract file path from URL
        const filePath = slider.image_url.split('/').pop();
        if (filePath) {
          // Delete image from storage
          await supabase.storage
            .from('public')
            .remove([`slider-images/${filePath}`]);
        }
      }

      const { error } = await supabase
        .from('hero_sliders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSliders(sliders.filter(slider => slider.id !== id));
      toast.success('Slider deleted successfully');
    } catch (error) {
      console.error('Error deleting slider:', error);
      toast.error('Failed to delete slider');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sliders.findIndex(slider => slider.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sliders.length - 1)
    ) {
      return;
    }

    const newSliders = [...sliders];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const [movedSlider] = newSliders.splice(currentIndex, 1);
    newSliders.splice(targetIndex, 0, movedSlider);

    // Update order_index for all sliders
    const updates = newSliders.map((slider, index) => ({
      id: slider.id,
      order_index: index + 1,
    }));

    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('hero_sliders')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      setSliders(newSliders);
      toast.success('Slider order updated');
    } catch (error) {
      console.error('Error reordering sliders:', error);
      toast.error('Failed to reorder sliders');
      fetchSliders(); // Refresh the list to ensure consistency
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hero Sliders</CardTitle>
          <Button onClick={() => navigate('/dashboard/manager/sliders/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Slider
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sliders.map((slider) => (
                <TableRow key={slider.id}>
                  <TableCell>
                    <div className="w-16 h-16 relative rounded overflow-hidden">
                      <img
                        src={slider.image_url}
                        alt={slider.title || 'Slider image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{slider.title || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {slider.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={slider.is_active ? "default" : "secondary"}>
                      {slider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{slider.order_index}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/dashboard/manager/sliders/${slider.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/dashboard/manager/sliders/${slider.id}/edit`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Slider</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this slider? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSlider(slider.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SliderPage; 