import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InterestInquiry {
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
    organiser_id: string;
  };
  brand: {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
    phone?: string;
  };
}

export default function InterestInquiries() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<InterestInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibition, setSelectedExhibition] = useState<string>('all');
  const [exhibitions, setExhibitions] = useState<{ id: string; title: string; }[]>([]);

  useEffect(() => {
    const fetchInquiries = async () => {
      if (!user) return;

      try {
        const { data: exhibitionsData } = await supabase
          .from('exhibitions')
          .select('id, title')
          .eq('organiser_id', user.id);

        setExhibitions(exhibitionsData || []);

        const query = supabase
          .from('exhibition_interests')
          .select(`
            *,
            exhibition:exhibitions (
              id,
              title,
              description,
              start_date,
              end_date,
              organiser_id
            ),
            brand:profiles (
              id,
              full_name,
              email,
              company_name,
              phone
            )
          `)
          .eq('exhibition.organiser_id', user.id)
          .order('created_at', { ascending: false });

        if (selectedExhibition !== 'all') {
          query.eq('exhibition_id', selectedExhibition);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error details:', error);
          throw error;
        }
        
        // Filter out inquiries that don't belong to the organizer's exhibitions
        const filteredData = data?.filter(inquiry => 
          inquiry.exhibition?.organiser_id === user.id
        ) || [];

        setInquiries(filteredData);
      } catch (error) {
        console.error('Error fetching inquiries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, [user, selectedExhibition]);

  if (!user) {
    return (
      <div className="text-center py-8">
        Please log in to view interest inquiries.
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
        <h1 className="text-3xl font-bold">Interest Inquiries</h1>
        <p className="text-muted-foreground mt-2">
          View brands interested in your exhibitions
        </p>
      </div>

      <div className="mb-6">
        <Select
          value={selectedExhibition}
          onValueChange={setSelectedExhibition}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by Exhibition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exhibitions</SelectItem>
            {exhibitions.map((exhibition) => (
              <SelectItem key={exhibition.id} value={exhibition.id}>
                {exhibition.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inquiries.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-lg text-muted-foreground">
                No interest inquiries found.
              </p>
            </CardContent>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-3 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {inquiry.exhibition.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Interest shown {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Brand Details Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {inquiry.brand.company_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{inquiry.brand.company_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{inquiry.brand.full_name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a 
                      href={`mailto:${inquiry.brand.email}`} 
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                        <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                      </svg>
                      <span className="line-clamp-1">Email</span>
                    </a>
                    {inquiry.brand.phone && (
                      <a 
                        href={`tel:${inquiry.brand.phone}`} 
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                        </svg>
                        <span className="line-clamp-1">Call</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Exhibition Dates */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12ZM6 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H6ZM7.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V12ZM8 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H8ZM9.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V10ZM10 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H10ZM9.25 14a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V14ZM12 9.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V10a.75.75 0 0 0-.75-.75H12ZM11.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V12ZM12 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H12ZM13.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H14a.75.75 0 0 1-.75-.75V10ZM14 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H14Z" />
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {format(new Date(inquiry.exhibition.start_date), 'MMM d')} - {format(new Date(inquiry.exhibition.end_date), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Notes if any */}
                {inquiry.notes && (
                  <div className="text-xs">
                    <p className="text-muted-foreground line-clamp-2">{inquiry.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    className="w-full h-8 text-xs"
                    onClick={() => navigate(`/dashboard/organiser/exhibitions/${inquiry.exhibition_id}`)}
                  >
                    View Exhibition Details
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-8 text-xs bg-primary/5 hover:bg-primary/10 text-primary"
                    onClick={() => window.open(`/brands/${inquiry.brand.id}`, '_blank')}
                  >
                    View Brand Portfolio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 