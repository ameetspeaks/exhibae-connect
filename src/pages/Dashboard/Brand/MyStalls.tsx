import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, MapPin, IndianRupee, Maximize2, AlertCircle, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';

interface BrandStall {
  application_id: string;
  brand_id: string;
  exhibition_id: string;
  stall_id: string;
  stall_instance_id: string;
  application_status: string;
  application_date: string;
  exhibition_title: string;
  exhibition_start_date: string;
  exhibition_end_date: string;
  exhibition_address: string;
  exhibition_status: string;
  stall_name: string;
  stall_description: string;
  stall_price: number;
  stall_length: number;
  stall_width: number;
  booking_status: string;
  payment_status: string;
  booking_deadline: string;
  payment_deadline: string;
  booking_amount: number;
  total_paid_amount: number;
  exhibition_expiry: boolean;
}

const MyStalls = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stalls, setStalls] = useState<BrandStall[]>([]);

  useEffect(() => {
    if (user) {
      fetchStalls();
    }
  }, [user]);

  const fetchStalls = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('brand_stalls_view')
        .select('*')
        .eq('brand_id', user?.id)
        .order('exhibition_start_date', { ascending: true });

      if (error) {
        console.error('Error fetching stalls:', error);
        throw new Error('Failed to load stalls');
      }

      setStalls(data || []);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while loading stalls');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (stall: BrandStall) => {
    try {
      const { error } = await supabase
        .from('stall_bookings')
        .update({ booking_status: 'confirmed' })
        .eq('application_id', stall.application_id);

      if (error) throw error;
      
      await fetchStalls();
    } catch (error) {
      console.error('Error confirming booking:', error);
      setError('Failed to confirm booking. Please try again.');
    }
  };

  const getStallsByStatus = () => {
    const now = new Date();
    return {
      active: stalls.filter(stall => {
        const startDate = new Date(stall.exhibition_start_date);
        const endDate = new Date(stall.exhibition_end_date);
        return startDate <= now && endDate >= now && !stall.exhibition_expiry;
      }),
      upcoming: stalls.filter(stall => {
        const startDate = new Date(stall.exhibition_start_date);
        return startDate > now && !stall.exhibition_expiry;
      }),
      past: stalls.filter(stall => {
        const endDate = new Date(stall.exhibition_end_date);
        return endDate < now || stall.exhibition_expiry;
      })
    };
  };

  const StallCard = ({ stall }: { stall: BrandStall }) => (
    <Card className={`hover:shadow-lg transition-shadow ${stall.exhibition_expiry ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{stall.stall_name}</CardTitle>
            <CardDescription>{stall.exhibition_title}</CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant={stall.booking_status === 'confirmed' ? "default" : "secondary"}>
              {stall.booking_status === 'confirmed' ? 'Confirmed' : 'Pending Confirmation'}
            </Badge>
            {stall.payment_status === 'completed' && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Paid
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {new Date(stall.exhibition_start_date).toLocaleDateString()} - {new Date(stall.exhibition_end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{stall.exhibition_address}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Maximize2 className="h-4 w-4 mr-2" />
              <span>Size: {stall.stall_length}m × {stall.stall_width}m</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <IndianRupee className="h-4 w-4 mr-2" />
              <span>Price: ₹{formatCurrency(stall.stall_price)}</span>
            </div>
            {stall.stall_description && (
              <div className="text-sm text-gray-500">
                <p>{stall.stall_description}</p>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2" />
              <span>Application ID: {stall.application_id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {stall.booking_deadline && stall.booking_status === 'pending' && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-800" />
            <AlertDescription className="text-red-800">
              Booking deadline: {new Date(stall.booking_deadline).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        {stall.payment_status === 'pending' && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertDescription className="text-yellow-800">
              Payment pending: ₹{formatCurrency(stall.booking_amount - stall.total_paid_amount)}
              {stall.payment_deadline && (
                <span className="block mt-1">
                  Due by: {new Date(stall.payment_deadline).toLocaleDateString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2 space-y-2">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/dashboard/brand/exhibitions/${stall.exhibition_id}`)}
            >
              View Exhibition
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/dashboard/brand/exhibitions/${stall.exhibition_id}/stalls`)}
            >
              View Layout
            </Button>
          </div>
          
          {!stall.exhibition_expiry && (
            <>
              {stall.booking_status !== 'confirmed' && (
                <Button 
                  className="w-full bg-exhibae-navy hover:bg-opacity-90"
                  onClick={() => handleConfirmBooking(stall)}
                >
                  Confirm Booking
                </Button>
              )}
              
              {stall.payment_status === 'pending' && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/brand/payments/${stall.application_id}`)}
                >
                  Make Payment
                </Button>
              )}
            </>
          )}
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

  const categorizedStalls = getStallsByStatus();

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="text-2xl font-bold">My Stalls</h2>
        <p className="text-gray-600">View all your approved stalls across exhibitions</p>
      </div>

      {stalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-500 text-center">No approved stalls found</p>
            <Button 
              className="mt-4 bg-exhibae-navy hover:bg-opacity-90"
              onClick={() => navigate('/dashboard/brand/find')}
            >
              Browse Exhibitions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Active ({categorizedStalls.active.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({categorizedStalls.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({categorizedStalls.past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categorizedStalls.active.map((stall) => (
                <StallCard key={stall.application_id} stall={stall} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categorizedStalls.upcoming.map((stall) => (
                <StallCard key={stall.application_id} stall={stall} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categorizedStalls.past.map((stall) => (
                <StallCard key={stall.application_id} stall={stall} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MyStalls; 