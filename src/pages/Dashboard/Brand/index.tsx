import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    recentApplications: [],
    upcomingExhibitions: [],
    applicationStats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0
    }
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent applications
      const { data: applications, error: applicationsError } = await supabase
        .from('stall_applications')
        .select(`
          id,
          status,
          created_at,
          stall:stalls (
            id,
            name,
            price
          ),
          exhibition:exhibitions (
            id,
            title,
            start_date,
            end_date,
            address
          )
        `)
        .eq('brand_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (applicationsError) throw applicationsError;

      // Fetch upcoming exhibitions
      const { data: exhibitions, error: exhibitionsError } = await supabase
        .from('exhibitions')
        .select(`
          id,
          title,
          start_date,
          end_date,
          address,
          stalls (
            id,
            stall_applications (
              id,
              status
            )
          )
        `)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);

      if (exhibitionsError) throw exhibitionsError;

      // Process exhibitions to count available stalls
      const processedExhibitions = exhibitions?.map(exhibition => ({
        ...exhibition,
        availableStalls: exhibition.stalls.filter(stall => 
          !stall.stall_applications?.some(app => app.status === 'confirmed')
        ).length
      }));

      // Get application statistics
      const { data: stats, error: statsError } = await supabase
        .from('stall_applications')
        .select('status')
        .eq('brand_id', user?.id);

      if (statsError) throw statsError;

      const applicationStats = {
        total: stats?.length || 0,
        pending: stats?.filter(app => app.status === 'pending').length || 0,
        confirmed: stats?.filter(app => app.status === 'confirmed').length || 0,
        rejected: stats?.filter(app => app.status === 'rejected').length || 0
      };

      setDashboardData({
        recentApplications: applications || [],
        upcomingExhibitions: processedExhibitions || [],
        applicationStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        <h1 className="text-2xl font-bold">Brand Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your exhibition activities.</p>
      </div>

      {/* Application Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.applicationStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dashboardData.applicationStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.applicationStats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData.applicationStats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your most recent stall applications</CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/brand/applications')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData.recentApplications.length === 0 ? (
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
            <div className="space-y-4">
              {dashboardData.recentApplications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{application.exhibition?.title}</h3>
                        <div className="flex items-center space-x-2 text-gray-600 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(application.exhibition?.start_date).toLocaleDateString()} - {new Date(application.exhibition?.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 mt-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Exhibitions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Upcoming Exhibitions</CardTitle>
              <CardDescription>Latest exhibition opportunities</CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/brand/find')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData.upcomingExhibitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No upcoming exhibitions at the moment.
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.upcomingExhibitions.map((exhibition) => (
                <Card key={exhibition.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{exhibition.title}</h3>
                        <Badge variant="outline">
                          {exhibition.availableStalls} stalls available
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{exhibition.address}</span>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          size="sm"
                          className="bg-exhibae-navy hover:bg-opacity-90"
                          onClick={() => navigate(`/dashboard/brand/exhibitions/${exhibition.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandDashboard; 