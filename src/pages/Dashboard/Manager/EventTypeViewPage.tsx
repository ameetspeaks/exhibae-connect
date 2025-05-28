import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EventType } from '@/components/tables/events-columns';

const EventTypeViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);

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
        setEventType(data);
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

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  if (!eventType) {
    return <div>Event type not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/manager/events')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Types
          </Button>
        </div>
        <Button onClick={() => navigate(`/dashboard/manager/events/${id}/edit`)}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit Event Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Type Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Name</h3>
            <p className="mt-1 text-lg">{eventType.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{eventType.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="mt-1">
              {new Date(eventType.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="mt-1">
              {new Date(eventType.updated_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventTypeViewPage; 