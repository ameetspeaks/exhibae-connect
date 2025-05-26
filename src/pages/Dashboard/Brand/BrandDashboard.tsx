import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCheck, X, Search, Briefcase, Loader2, IndianRupee, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BrandStatistics {
  total_applications: number;
  approved_applications: number;
  rejected_applications: number;
  pending_applications: number;
  active_stalls: number;
  total_exhibitions_participated: number;
  last_updated: string;
}

interface Exhibition {
  id: string;
  title: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  application_deadline?: string;
  stalls?: Array<{
    id: string;
    name: string;
    price: number;
    status: string;
  }>;
  availableStallsCount?: number;
}

interface StallApplication {
  exhibition: Exhibition;
}

interface BrandActivity {
  id: string;
  activity_type: string;
  stall_application_id: string;
  details: {
    exhibition_id?: string;
    stall_id?: string;
    status?: string;
    old_status?: string;
    new_status?: string;
  };
  created_at: string;
  stall_applications?: {
    exhibition: Exhibition;
  };
}

interface RawActivityData {
  id: string;
  activity_type: string;
  stall_application_id: string;
  details: {
    exhibition_id?: string;
    stall_id?: string;
    status?: string;
    old_status?: string;
    new_status?: string;
  };
  created_at: string;
  stall_applications: {
    exhibition: {
      id: string;
      title: string;
    };
  } | null;
}

interface DashboardData {
  statistics: BrandStatistics;
  recentActivity: BrandActivity[];
  upcomingExhibitions: Exhibition[];
}

const BrandDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    statistics: {
      total_applications: 0,
      approved_applications: 0,
      rejected_applications: 0,
      pending_applications: 0,
      active_stalls: 0,
      total_exhibitions_participated: 0,
      last_updated: new Date().toISOString()
    },
    recentActivity: [],
    upcomingExhibitions: []
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active stalls (ongoing exhibitions with confirmed applications)
      const { data: activeStallsData, error: activeStallsError } = await supabase
        .from('stall_applications')
        .select(`
          id,
          exhibition:exhibitions (
            id,
            end_date,
            status
          )
        `)
        .eq('brand_id', user?.id)
        .in('status', ['confirmed', 'booked'])
        .gte('exhibition.end_date', new Date().toISOString())
        .eq('exhibition.status', 'active');

      if (activeStallsError) throw activeStallsError;

      // Fetch application statistics
      const { data: applicationStats, error: applicationStatsError } = await supabase
        .from('stall_applications')
        .select('status')
        .eq('brand_id', user?.id);

      if (applicationStatsError) throw applicationStatsError;

      const totalApplications = applicationStats?.length || 0;
      const approvedApplications = applicationStats?.filter(app => ['confirmed', 'booked'].includes(app.status)).length || 0;
      const pendingApplications = applicationStats?.filter(app => app.status === 'pending').length || 0;
      const rejectedApplications = applicationStats?.filter(app => app.status === 'rejected').length || 0;

      // Fetch total exhibitions participated (exhibitions with confirmed applications)
      const { data: participatedExhibitions, error: participatedError } = await supabase
        .from('stall_applications')
        .select('exhibition_id', { count: 'exact' })
        .eq('brand_id', user?.id)
        .in('status', ['confirmed', 'booked'])
        .order('exhibition_id');

      if (participatedError) throw participatedError;

      // Get unique exhibition IDs
      const uniqueExhibitionIds = [...new Set(participatedExhibitions?.map(app => app.exhibition_id) || [])];

      // Fetch recent activity with exhibition details
      const { data: activityData, error: activityError } = await supabase
        .from('brand_activities_secure')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) {
        console.error('Error fetching activity:', activityError);
        throw new Error('Failed to load activity');
      }

      // Transform activity data to match our interface
      const transformedActivityData: BrandActivity[] = (activityData || []).map(item => ({
        id: item.id,
        activity_type: item.activity_type,
        stall_application_id: item.stall_application_id,
        details: item.details,
        created_at: item.created_at,
        stall_applications: item.exhibition_id ? {
          exhibition: {
            id: item.exhibition_id,
            title: item.exhibition_title
          }
        } : undefined
      }));

      // Fetch upcoming exhibitions with available stalls
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from('exhibitions')
        .select(`
          id,
          title,
          start_date,
          end_date,
          address,
          stalls (
            id,
            name,
            price,
            status
          )
        `)
        .eq('status', 'active')
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);

      if (exhibitionsError) {
        console.error('Error fetching exhibitions:', exhibitionsError);
        throw new Error('Failed to load exhibitions');
      }

      // Process exhibitions to only show those with available stalls
      const exhibitionsWithAvailableStalls = (exhibitionsData || [])
        .filter(exhibition => exhibition.stalls?.some(stall => stall.status === 'available'))
        .map(exhibition => ({
          ...exhibition,
          availableStallsCount: exhibition.stalls?.filter(stall => stall.status === 'available').length || 0
        }));

      setDashboardData({
        statistics: {
          total_applications: totalApplications,
          approved_applications: approvedApplications,
          rejected_applications: rejectedApplications,
          pending_applications: pendingApplications,
          active_stalls: activeStallsData?.length || 0,
          total_exhibitions_participated: uniqueExhibitionIds.length,
          last_updated: new Date().toISOString()
        },
        recentActivity: transformedActivityData,
        upcomingExhibitions: exhibitionsWithAvailableStalls
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application_submitted':
        return <Calendar className="h-4 w-4" />;
      case 'application_approved':
        return <CheckCheck className="h-4 w-4 text-green-500" />;
      case 'application_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'exhibition_started':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'exhibition_completed':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatActivityMessage = (activity: BrandActivity) => {
    const exhibitionTitle = activity.stall_applications?.exhibition?.title || 'an exhibition';
    
    switch (activity.activity_type) {
      case 'application_submitted':
        return `Applied for a stall in ${exhibitionTitle}`;
      case 'application_approved':
        return `Application approved for ${exhibitionTitle}`;
      case 'application_rejected':
        return `Application rejected for ${exhibitionTitle}`;
      case 'exhibition_started':
        return `Exhibition started: ${exhibitionTitle}`;
      case 'exhibition_completed':
        return `Exhibition completed: ${exhibitionTitle}`;
      case 'payment_made':
        return `Payment completed for ${exhibitionTitle}`;
      default:
        return 'Activity recorded';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  const { statistics } = dashboardData;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome back! Here's your exhibition activity summary.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-exhibae-navy text-exhibae-navy hover:bg-exhibae-navy hover:text-white" asChild>
            <Link to={`/brands/${user?.id}`}>
              View Profile
            </Link>
          </Button>
          <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
            <Link to="/dashboard/brand/find">
              <Search className="h-4 w-4 mr-2" />
              Find Exhibitions
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Stalls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Stalls</CardTitle>
            <Briefcase className="h-5 w-5 text-exhibae-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.active_stalls}</div>
            <p className="text-xs text-muted-foreground">Current exhibitions</p>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Calendar className="h-5 w-5 text-exhibae-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_applications}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                {statistics.approved_applications} Approved
              </Badge>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                {statistics.pending_applications} Pending
              </Badge>
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                {statistics.rejected_applications} Rejected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Exhibitions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Exhibitions</CardTitle>
            <Activity className="h-5 w-5 text-exhibae-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_exhibitions_participated}</div>
            <p className="text-xs text-muted-foreground">Participated in</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest exhibition activities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{formatActivityMessage(activity)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
              <Button variant="link" size="sm" className="text-exhibae-coral" asChild>
                <Link to="/dashboard/brand/find">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.upcomingExhibitions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming exhibitions</p>
              ) : (
                dashboardData.upcomingExhibitions.map((exhibition) => (
                  <Card key={exhibition.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{exhibition.title}</h3>
                          <Badge variant="outline">
                            {exhibition.availableStallsCount} stalls available
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                          </span>
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandDashboard;
