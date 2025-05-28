import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { columns, EventType } from '@/components/tables/events-columns';

const EventsPage = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event types:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch event types',
          variant: 'destructive',
        });
        return;
      }

      setEventTypes(data || []);
    } catch (error: any) {
      console.error('Error in fetchEventTypes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch event types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Types</h1>
          <p className="text-gray-600">Manage event types in the system</p>
        </div>
        <Button onClick={() => navigate('/dashboard/manager/events/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Event Types</CardTitle>
          <CardDescription>
            View and manage all event types available in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : (
            <DataTable 
              columns={columns} 
              data={eventTypes}
              meta={{
                refreshData: fetchEventTypes
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsPage; 