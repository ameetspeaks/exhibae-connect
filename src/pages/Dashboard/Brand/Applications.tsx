import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

interface Exhibition {
  id: string;
  title: string;
  address: string;
  start_date: string;
  end_date: string;
}

interface Stall {
  id: string;
  name: string;
  length: number;
  width: number;
  price: number;
}

interface Application {
  id: string;
  stall_id: string;
  brand_id: string;
  exhibition_id: string;
  status: string;
  message: string;
  booking_deadline: string;
  booking_confirmed: boolean;
  stall_instance_id: string;
  created_at: string;
  updated_at: string;
  stall: Stall;
  exhibition: Exhibition;
}

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications for user:', user?.id);
      const { data, error } = await supabase
        .from('stall_applications')
        .select(`
          id,
          stall_id,
          brand_id,
          exhibition_id,
          status,
          message,
          booking_deadline,
          booking_confirmed,
          stall_instance_id,
          created_at,
          updated_at,
          stall:stalls!stall_id (
            id,
            name,
            length,
            width,
            price
          ),
          exhibition:exhibitions!exhibition_id (
            id,
            title,
            address,
            start_date,
            end_date
          )
        `)
        .eq('brand_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Check for new applications and notify
      const previousApplications = applications;
      const newApplications = (data || []) as Application[];
      
      if (previousApplications.length > 0) {
        newApplications.forEach(newApp => {
          const isNew = !previousApplications.find(oldApp => oldApp.id === newApp.id);
          if (isNew) {
            addNotification({
              title: 'Application Submitted',
              message: `Your application for ${newApp.exhibition.title} has been submitted successfully.`,
              type: 'application_received',
              link: `/dashboard/brand/applications`,
            });
          }
        });
      }

      setApplications(newApplications);
    } catch (error: any) {
      console.error('Error in fetchApplications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications. ' + (error.message || ''),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg">{application.exhibition?.title}</h3>
            <div className="flex items-center space-x-2 text-gray-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{application.exhibition?.address}</span>
            </div>
          </div>
          <Badge className={getStatusColor(application.status)}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {application.exhibition?.start_date && new Date(application.exhibition.start_date).toLocaleDateString()} - {application.exhibition?.end_date && new Date(application.exhibition.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Applied: {new Date(application.created_at).toLocaleDateString()}</span>
            </div>
            {application.booking_deadline && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Booking Deadline: {new Date(application.booking_deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Stall:</span> {application.stall?.name}
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Size:</span> {application.stall?.length}m × {application.stall?.width}m
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Price:</span> ${application.stall?.price}
            </div>
            {application.booking_confirmed && (
              <div className="text-sm text-green-600 font-medium">
                Booking Confirmed
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline"
            onClick={() => navigate(`/dashboard/brand/exhibitions/${application.exhibition_id}`)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-gray-600">Track and manage your exhibition applications</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            You haven't applied to any exhibitions yet.
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/dashboard/brand/find')}
                className="bg-exhibae-navy hover:bg-opacity-90"
              >
                Browse Exhibitions
              </Button>
            </div>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-6">
              {filterApplications('all').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              {filterApplications('pending').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>

            <TabsContent value="confirmed" className="mt-6">
              {filterApplications('confirmed').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {filterApplications('rejected').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Applications; 