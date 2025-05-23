import { useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Loader2, Check, X, Filter, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  status?: 'upcoming' | 'past';
}

const MyExhibitions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  // Fetch exhibitions the shopper is attending
  const { data: attendingExhibitions, isLoading: isLoadingAttending } = useQuery({
    queryKey: ['shopper-attending-exhibitions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibition_attending')
        .select(`
          id,
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
      
      // Transform the data and add status
      const now = new Date();
      return data.map((item: any) => ({
        attendingId: item.id,
        ...item.exhibitions,
        status: new Date(item.exhibitions.end_date) >= now ? 'upcoming' : 'past'
      })) as (Exhibition & { attendingId: string })[];
    },
    enabled: !!user?.id,
  });

  // Remove attendance mutation
  const removeAttendance = useMutation({
    mutationFn: async (attendingId: string) => {
      const { error } = await supabase
        .from('exhibition_attending')
        .delete()
        .eq('id', attendingId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopper-attending-exhibitions'] });
      queryClient.invalidateQueries({ queryKey: ['shopper-statistics'] });
      toast({
        title: "Removed",
        description: "Exhibition removed from your list.",
      });
    },
    onError: (error: any) => {
      console.error('Error removing attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove exhibition",
        variant: "destructive",
      });
    }
  });

  const handleRemoveAttendance = (attendingId: string) => {
    removeAttendance.mutate(attendingId);
  };

  // Get counts for tabs
  const upcomingCount = attendingExhibitions?.filter(e => e.status === 'upcoming').length || 0;
  const pastCount = attendingExhibitions?.filter(e => e.status === 'past').length || 0;
  const totalCount = attendingExhibitions?.length || 0;

  // Filter exhibitions based on selected filter
  const filteredExhibitions = attendingExhibitions?.filter(exhibition => {
    if (filter === 'all') return true;
    return exhibition.status === filter;
  });

  return (
    <div className="space-y-6">
      <DashboardWidget
        role={UserRole.SHOPPER}
        title="My Exhibitions"
        description="Manage your exhibition attendance"
        icon={<Ticket className="h-5 w-5 text-exhibae-navy" />}
        variant="gradient"
      >
        <Tabs 
          defaultValue="all" 
          value={filter} 
          onValueChange={(value) => setFilter(value as 'all' | 'upcoming' | 'past')}
          className="mt-4"
        >
          <TabsList className="bg-white/20 grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="all" className="text-white data-[state=active]:bg-white data-[state=active]:text-exhibae-navy">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-white data-[state=active]:bg-white data-[state=active]:text-exhibae-navy">
              Upcoming ({upcomingCount})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-white data-[state=active]:bg-white data-[state=active]:text-exhibae-navy">
              Past ({pastCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </DashboardWidget>

      <DashboardWidget
        role={UserRole.SHOPPER}
        title={`${filter === 'all' ? 'All' : filter === 'upcoming' ? 'Upcoming' : 'Past'} Exhibitions`}
        variant="outline"
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
        ) : filteredExhibitions && filteredExhibitions.length > 0 ? (
          <div className="space-y-4">
            {filteredExhibitions.map((exhibition) => (
              <Card key={exhibition.id} className="bg-gray-50 border-none hover:bg-gray-100 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{exhibition.title}</h3>
                        <Badge variant={exhibition.status === 'upcoming' ? 'default' : 'secondary'} className="ml-2">
                          {exhibition.status === 'upcoming' ? 'Upcoming' : 'Past'}
                        </Badge>
                      </div>
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
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => handleRemoveAttendance(exhibition.attendingId)}
                        disabled={removeAttendance.isPending}
                        className="h-9 w-9"
                      >
                        {removeAttendance.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? "You haven't marked any exhibitions to attend yet." 
                : filter === 'upcoming' 
                  ? "You don't have any upcoming exhibitions." 
                  : "You don't have any past exhibitions."}
            </p>
            <Button asChild>
              <Link to="/dashboard/shopper/find">Explore Exhibitions</Link>
            </Button>
          </div>
        )}
      </DashboardWidget>
    </div>
  );
};

export default MyExhibitions; 