import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Building2, Tags, LayoutDashboard, Ruler, CalendarDays, MessageSquare, FileText, Heart, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailLogs } from '@/components/dashboard/manager/EmailLogs';

interface DashboardStats {
  totalUsers: number;
  totalVenueTypes: number;
  totalCategories: number;
}

interface Activity {
  id: string;
  action: string;
  target: string;
  timestamp: string;
}

interface DatabaseStallApplication {
  id: string;
  created_at: string;
  status: string;
  brand_id: {
    full_name: string;
    company_name: string;
  };
  exhibition_id: {
    id: string;
    title: string;
  };
  stall_id: {
    name: string;
    price: number;
  };
}

interface StallApplication {
  id: string;
  created_at: string;
  status: string;
  brand: {
    full_name: string;
    company_name: string;
  };
  exhibition: {
    id: string;
    title: string;
  };
  stall: {
    name: string;
    price: number;
  };
}

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard/manager',
        icon: LayoutDashboard,
    },
    {
        name: 'Exhibitions',
        href: '/dashboard/manager/exhibitions',
        icon: CalendarDays,
    },
    {
        name: 'Applications',
        href: '/dashboard/manager/applications',
        icon: FileText,
    },
    {
        name: 'Brand Interests',
        href: '/dashboard/manager/brand-interests',
        icon: Heart,
    },
    {
        name: 'Hero Sliders',
        href: '/dashboard/manager/sliders',
        icon: LayoutDashboard,
    },
    {
        name: 'Users',
        href: '/dashboard/manager/users',
        icon: Users,
    },
    {
        name: 'Venue Types',
        href: '/dashboard/manager/venue-types',
        icon: Building2,
    },
    {
        name: 'Measurement Units',
        href: '/dashboard/manager/measurement-units',
        icon: Ruler,
    },
    {
        name: 'Contact Messages',
        href: '/dashboard/manager/contact-messages',
        icon: MessageSquare,
    },
    {
        name: 'Support Chat',
        href: '/dashboard/manager/chat',
        icon: MessageSquare,
    },
];

const ManagerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVenueTypes: 0,
    totalCategories: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<StallApplication[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [brandInterests, setBrandInterests] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentApplications();
    fetchRecentContactMessages();
    fetchRecentBrandInterests();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total venue types
      const { count: venueTypeCount } = await supabase
        .from('venue_types')
        .select('*', { count: 'exact', head: true });

      // Fetch total categories
      const { count: categoryCount } = await supabase
        .from('exhibition_categories')
        .select('*', { count: 'exact', head: true });

      // Fetch recent activity (last 5 actions)
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: userCount || 0,
        totalVenueTypes: venueTypeCount || 0,
        totalCategories: categoryCount || 0
      });

      if (activities) {
        setRecentActivity(activities);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('stall_applications')
        .select(`
          id,
          created_at,
          status,
          brand_id(full_name, company_name),
          exhibition_id(id, title),
          stall_id(name, price)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        // Cast to any first to avoid TypeScript errors with nested objects
        const typedData: StallApplication[] = (data as any).map((item: any) => ({
          id: item.id,
          created_at: item.created_at,
          status: item.status,
          brand: item.brand_id,
          exhibition: item.exhibition_id,
          stall: item.stall_id
        }));
        setApplications(typedData);
      } else {
        setApplications([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch applications',
        variant: 'destructive',
      });
    }
  };

  const fetchRecentContactMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setContactMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const fetchRecentBrandInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibition_interests')
        .select(`
          id,
          created_at,
          exhibition:exhibitions (id, title),
          brand:profiles (id, full_name, company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setBrandInterests(data || []);
    } catch (error: any) {
      console.error('Error fetching brand interests:', error);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'category':
        navigate('/dashboard/manager/categories');
        break;
      case 'venue':
        navigate('/dashboard/manager/venue-types');
        break;
      case 'users':
        navigate('/dashboard/manager/users');
        break;
      case 'units':
        navigate('/dashboard/manager/measurement-units');
        break;
      case 'applications':
        navigate('/dashboard/manager/applications');
        break;
      case 'interests':
        navigate('/dashboard/manager/brand-interests');
        break;
      case 'sliders':
        navigate('/dashboard/manager/sliders');
        break;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Manager Dashboard</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emails">Email Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-6">
            <p className="text-gray-600">
              Welcome to the management dashboard. Here you can manage all aspects of the platform.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all roles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Venue Types</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVenueTypes}</div>
                  <p className="text-xs text-muted-foreground">
                    Available venues
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <Tags className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCategories}</div>
                  <p className="text-xs text-muted-foreground">
                    Exhibition categories
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm"
                      onClick={() => handleQuickAction('sliders')}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Manage Hero Sliders
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm"
                      onClick={() => handleQuickAction('category')}
                    >
                      <Tags className="mr-2 h-4 w-4" />
                      Manage Categories
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm"
                      onClick={() => handleQuickAction('venue')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Manage Venue Types
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm"
                      onClick={() => handleQuickAction('users')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Latest stall applications from brands</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((application) => (
                      <div key={application.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{application.brand.company_name}</p>
                          <p className="text-xs text-gray-500">{application.exhibition.title}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent applications</p>
                    )}
                  </div>
                  <Button
                    variant="link"
                    className="mt-4 w-full"
                    onClick={() => handleQuickAction('applications')}
                  >
                    View all applications
                  </Button>
                </CardContent>
              </Card>

              {/* Brand Interests */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Brand Interests</CardTitle>
                  <CardDescription>Recent exhibition interests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {brandInterests.slice(0, 6).map((interest) => (
                      <div key={interest.id} className="flex flex-col space-y-1 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">{interest.brand.company_name}</p>
                        <p className="text-xs text-gray-500">{interest.exhibition.title}</p>
                      </div>
                    ))}
                    {brandInterests.length === 0 && (
                      <div className="col-span-full">
                        <p className="text-sm text-gray-500 text-center py-4">No recent interests</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="link"
                    className="mt-6 w-full"
                    onClick={() => handleQuickAction('interests')}
                  >
                    View all interests
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="emails">
          <EmailLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard; 