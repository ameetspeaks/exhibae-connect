import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, Smartphone, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

const ViewSlider = () => {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [slider, setSlider] = useState<HeroSlider | null>(null);
  const [loading, setLoading] = useState(true);

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
            <CardTitle>View Hero Slider</CardTitle>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/manager/sliders/${id}/edit`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Slider
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                <span>Mobile View</span>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <span>Desktop View</span>
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
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Badge variant={slider.is_active ? "default" : "secondary"} className="mt-1">
                {slider.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
              <p className="mt-1 text-lg">{slider.title || '-'}</p>
            </div>

            {slider.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1">{slider.description}</p>
              </div>
            )}

            {slider.link_url && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Link URL</h3>
                <a
                  href={slider.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-primary hover:underline"
                >
                  {slider.link_url}
                </a>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Order Index</h3>
              <p className="mt-1">{slider.order_index}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewSlider; 