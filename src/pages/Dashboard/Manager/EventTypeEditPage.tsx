import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EventType } from '@/components/tables/events-columns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EventTypeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<EventType>>({
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setFormData(data);
      } catch (error: any) {
        console.error('Error fetching event type:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch event type',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventType();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from('event_types')
        .update({
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event type updated successfully',
      });

      navigate(`/dashboard/manager/events/${id}`);
    } catch (error: any) {
      console.error('Error updating event type:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event type',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/manager/events/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Event Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/manager/events/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventTypeEditPage; 