import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, CheckCheck, X, Plus, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/integrations/supabase/AuthProvider';

interface Application {
  id: string;
  brand: {
    name: string;
    company: string;
  };
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Exhibition {
  id: string;
  title: string;
  start_date: string;
}

const OrganiserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeExhibitions: 0,
    totalApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });
  
  const [upcomingExhibitions, setUpcomingExhibitions] = useState<Exhibition[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch active exhibitions
        const { data: activeExhibitions, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select('id')
          .eq('organiser_id', user.id)
          .eq('status', 'published');
          
        if (exhibitionsError) throw exhibitionsError;
        
        // First get the organizer's exhibitions
        const { data: organizerExhibitions, error: organizerExhibitionsError } = await supabase
          .from('exhibitions')
          .select('id')
          .eq('organiser_id', user.id);

        if (organizerExhibitionsError) throw organizerExhibitionsError;

        const exhibitionIds = organizerExhibitions?.map(e => e.id) || [];

        // Then fetch applications for those exhibitions
        const { data: applications, error: applicationsError } = await supabase
          .from('stall_applications')
          .select('id, status')
          .in('exhibition_id', exhibitionIds);
          
        if (applicationsError) throw applicationsError;
        
        // Calculate application statistics
        const approvedCount = applications?.filter(app => app.status === 'approved').length || 0;
        const rejectedCount = applications?.filter(app => app.status === 'rejected').length || 0;
        
        setStats({
          activeExhibitions: activeExhibitions?.length || 0,
          totalApplications: applications?.length || 0,
          approvedApplications: approvedCount,
          rejectedApplications: rejectedCount,
        });
        
        // Fetch upcoming exhibitions
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('exhibitions')
          .select('id, title, start_date')
          .eq('organiser_id', user.id)
          .eq('status', 'published')
          .gt('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(3);
          
        if (upcomingError) throw upcomingError;
        setUpcomingExhibitions(upcomingData || []);
        
        // Fetch recent applications with brand details
        const { data: recentData, error: recentError } = await supabase
          .from('stall_applications')
          .select(`
            id,
            created_at,
            status,
            brand_id,
            exhibition_id,
            profiles!stall_applications_brand_id_fkey (
              full_name,
              company_name
            )
          `)
          .in('exhibition_id', exhibitionIds)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentError) throw recentError;
        
        const formattedApplications = recentData?.map(app => ({
          id: app.id,
          brand: {
            name: app.profiles?.full_name || 'Unknown',
            company: app.profiles?.company_name || 'Unknown Company',
          },
          created_at: app.created_at,
          status: app.status,
        })) || [];
        
        setRecentApplications(formattedApplications);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  const handleApplicationAction = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('stall_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
        
      if (error) throw error;
      
      // Refresh the applications list
      setRecentApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      // Update stats
      setStats(prev => {
        const newStats = { ...prev };
        if (newStatus === 'approved') {
          newStats.approvedApplications++;
          if (prev.rejectedApplications > 0) newStats.rejectedApplications--;
        } else {
          newStats.rejectedApplications++;
          if (prev.approvedApplications > 0) newStats.approvedApplications--;
        }
        return newStats;
      });
      
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Dashboard Overview</h2>
        <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
          <Link to="/dashboard/organiser/exhibitions/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Exhibition
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Exhibitions</CardTitle>
            <Calendar className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeExhibitions}</div>
            <p className="text-xs text-muted-foreground">Current exhibitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.approvedApplications / stats.totalApplications) * 100 || 0).toFixed(0)}% processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.approvedApplications / stats.totalApplications) * 100 || 0).toFixed(0)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedApplications}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.rejectedApplications / stats.totalApplications) * 100 || 0).toFixed(0)}% rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exhibitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingExhibitions.length > 0 ? upcomingExhibitions.map((exhibition) => (
                <div key={exhibition.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-md bg-exhibae-navy bg-opacity-10 flex items-center justify-center text-exhibae-navy">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{exhibition.title}</p>
                    <p className="text-xs text-gray-500">
                      Starts in {
                        Math.ceil((new Date(exhibition.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      } days
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link to={`/dashboard/organiser/exhibitions/${exhibition.id}`}>Details</Link>
                  </Button>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground">
                  No upcoming exhibitions
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length > 0 ? recentApplications.map((application) => (
                <div key={application.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-md bg-exhibae-coral bg-opacity-10 flex items-center justify-center text-exhibae-coral">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{application.brand.company}</p>
                    <p className="text-xs text-gray-500">
                      Applied {Math.ceil((new Date().getTime() - new Date(application.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                  </div>
                  {application.status === 'pending' && (
                    <div className="flex space-x-2 ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleApplicationAction(application.id, 'approved')}
                      >
                        <CheckCheck className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleApplicationAction(application.id, 'rejected')}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                  {application.status !== 'pending' && (
                    <div className="ml-auto">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        application.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent applications
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganiserDashboard;
