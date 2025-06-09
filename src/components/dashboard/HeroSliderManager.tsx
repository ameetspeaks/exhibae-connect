import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Image, Upload, X, Loader2, Smartphone, Monitor } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

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

const HeroSliderManager = () => {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [dialogType, setDialogType] = useState<'mobile' | 'desktop' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch sliders',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !dialogType) {
      toast({
        title: 'Missing file',
        description: 'Please select an image',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `hero-sliders/${Date.now()}-${dialogType}.${selectedFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('sliders')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;
      
      const imageUrl = supabase.storage.from('sliders').getPublicUrl(fileName).data.publicUrl;

      // Insert into database
      const { error: dbError } = await supabase
        .from('hero_sliders')
        .insert({
          title: formData.title,
          description: formData.description,
          link_url: formData.link_url || null,
          mobile_image_url: dialogType === 'mobile' ? imageUrl : null,
          desktop_image_url: dialogType === 'desktop' ? imageUrl : null,
          image_url: imageUrl, // For backward compatibility
          order_index: sliders.length,
          is_active: true,
        });

      if (dbError) throw dbError;

      await fetchSliders();

      toast({
        title: 'Success',
        description: `${dialogType === 'mobile' ? 'Mobile' : 'Desktop'} slider created successfully`,
      });

      handleCloseDialog();
      
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedFile(null);
    setFormData({ title: '', description: '', link_url: '' });
  };

  const handleDelete = async (slider: HeroSlider) => {
    try {
      const { error } = await supabase
        .from('hero_sliders')
        .delete()
        .eq('id', slider.id);

      if (error) throw error;

      setSliders(prev => prev.filter(s => s.id !== slider.id));

      toast({
        title: 'Success',
        description: 'Hero slider deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete slider',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hero Sliders</h2>
          <p className="text-muted-foreground">Manage your homepage hero slider images</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDialogType('mobile')} size="sm" variant="outline">
            <Smartphone className="w-4 h-4 mr-2" />
            Add Mobile
          </Button>
          <Button onClick={() => setDialogType('desktop')} size="sm">
            <Monitor className="w-4 h-4 mr-2" />
            Add Desktop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sliders.map((slider) => (
          <Card key={slider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex gap-3">
                {/* Image Previews */}
                <div className="flex gap-2 flex-1 min-w-0">
                  {slider.mobile_image_url && (
                    <div className="w-[80px] space-y-1">
                      <AspectRatio ratio={9/16} className="bg-muted rounded-md overflow-hidden">
                        <img
                          src={slider.mobile_image_url}
                          alt={`${slider.title} - mobile`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <Smartphone className="w-3 h-3 text-white" />
                            <span className="text-[10px] text-white">9:16</span>
                          </div>
                        </div>
                      </AspectRatio>
                    </div>
                  )}
                  
                  {slider.desktop_image_url && (
                    <div className="w-[120px] space-y-1">
                      <AspectRatio ratio={16/9} className="bg-muted rounded-md overflow-hidden">
                        <img
                          src={slider.desktop_image_url}
                          alt={`${slider.title} - desktop`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <Monitor className="w-3 h-3 text-white" />
                            <span className="text-[10px] text-white">16:9</span>
                          </div>
                        </div>
                      </AspectRatio>
                    </div>
                  )}
                </div>

                {/* Content and Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-sm truncate">{slider.title}</h3>
                    {slider.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {slider.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={slider.is_active ? "default" : "secondary"} className="text-[10px]">
                        {slider.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {slider.link_url && (
                        <Link 
                          to={slider.link_url} 
                          className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[100px]"
                          title={slider.link_url}
                        >
                          {slider.link_url}
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(slider)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogType !== null} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
            <DialogTitle>
              Add New {dialogType === 'mobile' ? 'Mobile' : 'Desktop'} Slider
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 overflow-y-auto">
            <div className="space-y-2">
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  {dialogType === 'mobile' ? (
                    <>
                      <Smartphone className="w-4 h-4" />
                      Mobile Image (9:16)
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4" />
                      Desktop Image (16:9)
                    </>
                  )}
                </Label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dialogType === 'mobile' 
                    ? '640x960px - For mobile devices'
                    : '1920x1080px - For desktop devices'
                  }
                </p>
              </div>
              {selectedFile && (
                <AspectRatio 
                  ratio={dialogType === 'mobile' ? 9/16 : 16/9} 
                  className="bg-muted rounded-lg overflow-hidden h-[160px]"
                >
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              )}
            </div>

            <div>
              <Label className="text-sm">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter slider title"
                className="mt-1 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm">Link URL (optional)</Label>
              <Input
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="Enter link URL"
                className="mt-1 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm">Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter slider description"
                className="mt-1 text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 mt-2 sticky bottom-0 bg-background pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isUploading}
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                size="sm"
                className="text-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-2" />
                    Create Slider
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroSliderManager; 