import { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, Heart, Ticket, Compass } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import { UserRole } from '@/types/auth';

interface Exhibition {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  address: string;
  city: string;
  created_at: string;
}

const ShopperDashboard = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');
  
  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there');
    }
  }, [user]);

  // Fetch exhibitions the shopper is attending
  const { data: attendingExhibitions, isLoading: isLoadingAttending } = useQuery({
    queryKey: ['shopper-attending-exhibitions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibition_attending')
        .select(`
          exhibition_id,
          exhibitions (
            id,
            title,
            start_date,
            end_date,
            address,
            city,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to get the exhibitions directly
      return data.map((item: any) => item.exhibitions) as Exhibition[];
    },
    enabled: !!user?.id,
  });

  // Get statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['shopper-statistics', user?.id],
    queryFn: async () => {
      // Get count of attending exhibitions
      const { count: attendingCount, error: attendingError } = await supabase
        .from('exhibition_attending')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (attendingError) throw attendingError;

      // Get upcoming exhibitions (attending exhibitions that haven't ended yet)
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('exhibition_attending')
        .select(`
          exhibitions (
            id,
            end_date
          )
        `)
        .eq('user_id', user?.id);

      if (upcomingError) throw upcomingError;

      const now = new Date();
      const upcomingCount = upcomingData.filter(
        (item: any) => new Date(item.exhibitions.end_date) >= now
      ).length;

      return {
        totalAttending: attendingCount || 0,
        upcomingExhibitions: upcomingCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch recommended exhibitions
  const { data: recommendedExhibitions, isLoading: isLoadingRecommended } = useQuery({
    queryKey: ['shopper-recommended-exhibitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as Exhibition[];
    },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <DashboardWidget 
        role={UserRole.SHOPPER}
        title={`Welcome back, ${userName}`}
        description="Discover and manage your exhibition experiences"
        icon={<Users className="h-5 w-5 text-exhibae-navy" />}
        variant="gradient"
        className="mb-8"
        footer={
          <div className="flex gap-3 w-full justify-end">
            <Button asChild variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Link to="/dashboard/shopper/my-exhibitions">
                <Calendar className="mr-2 h-4 w-4" />
                My Exhibitions
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-exhibae-navy hover:bg-white/90">
              <Link to="/dashboard/shopper/find">
                <Compass className="mr-2 h-4 w-4" />
                Find Exhibitions
              </Link>
            </Button>
          </div>
        }
      >
        <p className="text-white/90 mb-2">
          ExhiBae helps you discover exciting exhibitions, track your attendance, and connect with brands you love.
        </p>
      </DashboardWidget>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardWidget 
          role={UserRole.SHOPPER}
          title="My Exhibitions"
          icon={<Calendar className="h-5 w-5 text-exhibae-navy" />}
          variant="outline"
          size="sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-800">
              {isLoadingStats ? <Skeleton className="h-10 w-16" /> : statistics?.totalAttending}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total exhibitions you're attending</p>
        </DashboardWidget>
        
        <DashboardWidget 
          role={UserRole.SHOPPER}
          title="Upcoming"
          icon={<Clock className="h-5 w-5 text-exhibae-navy" />}
          variant="outline"
          size="sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-800">
              {isLoadingStats ? <Skeleton className="h-10 w-16" /> : statistics?.upcomingExhibitions}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Upcoming exhibitions</p>
        </DashboardWidget>
        
        <DashboardWidget 
          role={UserRole.SHOPPER}
          title="Discover More" 
          icon={<Heart className="h-5 w-5 text-white" />}
          variant="gradient"
          size="sm"
        >
          <p className="text-sm text-white/90 mb-3">Find new exhibitions that match your interests</p>
          <Button asChild variant="secondary" size="sm" className="w-full mt-1 bg-white text-exhibae-navy hover:bg-white/90">
            <Link to="/dashboard/shopper/recommended">View Recommendations</Link>
          </Button>
        </DashboardWidget>
      </div>

      {/* Upcoming Exhibitions */}
      <DashboardWidget 
        role={UserRole.SHOPPER} 
        title="My Upcoming Exhibitions"
        variant="outline"
        footer={
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/shopper/my-exhibitions">View All</Link>
          </Button>
        }
      >
        {isLoadingAttending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-50 border-none">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-1/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : attendingExhibitions && attendingExhibitions.length > 0 ? (
          <div className="space-y-4">
            {attendingExhibitions.slice(0, 3).map((exhibition) => (
              <Card key={exhibition.id} className="bg-gray-50 border-none hover:bg-gray-100 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{exhibition.title}</h3>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{exhibition.address}, {exhibition.city}</span>
                        </div>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You haven't marked any exhibitions to attend yet.</p>
            <Button asChild>
              <Link to="/exhibitions">Explore Exhibitions</Link>
            </Button>
          </div>
        )}
      </DashboardWidget>

      {/* Recommended Exhibitions */}
      <DashboardWidget 
        role={UserRole.SHOPPER} 
        title="Recommended For You"
        variant="outline"
        footer={
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/shopper/recommended">View All</Link>
          </Button>
        }
      >
        {isLoadingRecommended ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-50 border-none">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendedExhibitions && recommendedExhibitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedExhibitions.map((exhibition) => (
              <Card key={exhibition.id} className="overflow-hidden bg-gray-50 border-none hover:bg-gray-100 transition-colors">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">{exhibition.title}</h3>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">
                        {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs line-clamp-1">{exhibition.city}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recommendations available at the moment.</p>
          </div>
        )}
      </DashboardWidget>
    </div>
  );
};

export default ShopperDashboard; 