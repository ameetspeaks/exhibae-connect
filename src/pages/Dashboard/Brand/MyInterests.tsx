import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ExhibitionInterest {
  id: string;
  exhibition_id: string;
  brand_id: string;
  created_at: string;
  notes?: string;
  exhibition: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
}

export default function MyInterests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interests, setInterests] = useState<ExhibitionInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return;

      try {
        console.log('Fetching interests for user:', user.id);
        
        const { data, error } = await supabase
          .from('exhibition_interests')
          .select(`
            id,
            exhibition_id,
            brand_id,
            created_at,
            notes,
            exhibition:exhibitions (
              id,
              title,
              description,
              start_date,
              end_date,
              address,
              city,
              state,
              country
            )
          `)
          .eq('brand_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error details:', error);
          throw error;
        }

        console.log('Fetched interests:', data);
        
        // Filter out any interests where exhibition is null (in case of deleted exhibitions)
        const validInterests = data?.filter(interest => interest.exhibition) || [];
        setInterests(validInterests);
      } catch (error: any) {
        console.error('Error fetching interests:', error.message);
        toast({
          title: "Error",
          description: "Failed to load your interests. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-8">
        Please log in to view your interests.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Interests</h1>
        <p className="text-muted-foreground mt-2">
          Track your registered interests in exhibitions
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {interests.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-lg text-muted-foreground mb-4">
                You haven't registered interest in any exhibitions yet.
              </p>
              <Button onClick={() => navigate('/exhibitions')}>
                Browse Exhibitions
              </Button>
            </CardContent>
          </Card>
        ) : (
          interests.map((interest) => (
            <Card key={interest.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-3 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {interest.exhibition.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Interest shown {format(new Date(interest.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Exhibition Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {interest.exhibition.description}
                </p>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                  </svg>
                  <span className="line-clamp-1">
                    {interest.exhibition.address}, {interest.exhibition.city}
                  </span>
                </div>

                {/* Exhibition Dates */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM10 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H10zM9.25 14a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V14zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12zM11.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75V12zM12 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H12zM13.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H14a.75.75 0 01-.75-.75V10zM14 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H14z" />
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {format(new Date(interest.exhibition.start_date), 'MMM d')} - {format(new Date(interest.exhibition.end_date), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Notes if any */}
                {interest.notes && (
                  <div className="text-xs">
                    <p className="text-muted-foreground line-clamp-2">{interest.notes}</p>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-2 h-8 text-xs"
                  onClick={() => navigate(`/exhibitions/${interest.exhibition_id}`)}
                >
                  View Exhibition Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 