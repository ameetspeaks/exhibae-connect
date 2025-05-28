import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

const SliderManagement = () => {
  const { supabase } = useSupabase();
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
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
      <h1 className="text-2xl font-bold mb-6">Manage Hero Sliders</h1>

      {/* Add New Slider Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Slider</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newSlider.title || ''}
              onChange={(e) => setNewSlider({ ...newSlider, title: e.target.value })}
              placeholder="Enter slider title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newSlider.description || ''}
              onChange={(e) => setNewSlider({ ...newSlider, description: e.target.value })}
              placeholder="Enter slider description"
            />
          </div>
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={newSlider.image_url || ''}
              onChange={(e) => setNewSlider({ ...newSlider, image_url: e.target.value })}
              placeholder="Enter image URL"
              required
            />
          </div>
          <div>
            <Label htmlFor="link_url">Link URL</Label>
            <Input
              id="link_url"
              value={newSlider.link_url || ''}
              onChange={(e) => setNewSlider({ ...newSlider, link_url: e.target.value })}
              placeholder="Enter link URL"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={newSlider.is_active}
              onCheckedChange={(checked) => setNewSlider({ ...newSlider, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={handleAddSlider} className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Slider
          </Button>
        </div>
      </div>

      {/* Existing Sliders List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Sliders</h2>
          <div className="space-y-6">
            {sliders.map((slider) => (
              <div
                key={slider.id}
                className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                <div className="w-24 h-24 relative rounded overflow-hidden">
                  <img
                    src={slider.image_url}
                    alt={slider.title || 'Slider image'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={slider.title || ''}
                    onChange={(e) => handleUpdateSlider(slider.id, { title: e.target.value })}
                    placeholder="Title"
                  />
                  <Textarea
                    value={slider.description || ''}
                    onChange={(e) => handleUpdateSlider(slider.id, { description: e.target.value })}
                    placeholder="Description"
                  />
                  <Input
                    value={slider.link_url || ''}
                    onChange={(e) => handleUpdateSlider(slider.id, { link_url: e.target.value })}
                    placeholder="Link URL"
                  />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleReorder(slider.id, 'up')}
                      disabled={sliders.indexOf(slider) === 0}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleReorder(slider.id, 'down')}
                      disabled={sliders.indexOf(slider) === sliders.length - 1}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slider.is_active}
                      onCheckedChange={(checked) => handleUpdateSlider(slider.id, { is_active: checked })}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteSlider(slider.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SliderManagement; 