import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface HeroSlider {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

const ViewSlider = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
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
            <CardTitle>View Slider</CardTitle>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/manager/sliders/${id}/edit`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Slider
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Preview</h3>
              <div className="aspect-video rounded-lg overflow-hidden border">
                <img
                  src={slider.image_url}
                  alt={slider.title || 'Slider preview'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge variant={slider.is_active ? "default" : "secondary"}>
                  {slider.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Index</h3>
                <p className="text-gray-600">{slider.order_index}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Title</h3>
                <p className="text-gray-600">{slider.title || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {slider.description || '-'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Link URL</h3>
                {slider.link_url ? (
                  <a
                    href={slider.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {slider.link_url}
                  </a>
                ) : (
                  <p className="text-gray-600">-</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewSlider; 