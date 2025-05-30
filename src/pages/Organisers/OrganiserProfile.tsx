import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Calendar, Globe, Mail, MapPin, Phone, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getInitials } from '@/lib/utils';

interface OrganiserProfile {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  description: string | null;
  website_url: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  attendees_hosted: number;
  created_at: string;
  role: string;
}

interface Exhibition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  address: string;
  city: string;
  state: string;
  status: string;
  banner_url?: string;
}

export default function OrganiserProfile() {
  const { organiserId } = useParams<{ organiserId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OrganiserProfile | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganiserProfile = async () => {
      if (!organiserId) return;
      
      try {
        console.log('Fetching organiser profile for ID:', organiserId);

        // Fetch organiser profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', organiserId)
          .eq('role', 'organiser')
          .single();

        console.log('Profile Query Result:', { profileData, profileError });

        if (profileError) {
          console.error('Profile Error:', profileError);
          throw profileError;
        }

        if (!profileData) {
          console.log('Profile not found');
          setProfile(null);
          return;
        }

        console.log('Found Profile:', profileData);

        // Now fetch exhibitions for this organiser
        const { data: exhibitionsData, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select(`
            id,
            title,
            description,
            start_date,
            end_date,
            address,
            city,
            state,
            status,
            banner_url
          `)
          .eq('organiser_id', organiserId)
          .eq('status', 'published')
          .order('start_date', { ascending: false });

        if (exhibitionsError) {
          console.error('Exhibitions Error:', exhibitionsError);
          throw exhibitionsError;
        }

        console.log('Found Exhibitions:', exhibitionsData);

        setProfile(profileData);
        setExhibitions(exhibitionsData || []);
      } catch (error) {
        console.error('Error fetching organiser profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganiserProfile();
  }, [organiserId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Organiser not found</h2>
        <p className="text-muted-foreground mb-6">The organiser profile you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Section */}
      <div className="relative h-[300px] bg-gradient-to-r from-[#4B1E25] to-[#4B1E25]/80">
        {profile.cover_image_url && (
          <img
            src={profile.cover_image_url}
            alt={profile.company_name || profile.full_name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.company_name || profile.full_name} />
                <AvatarFallback>{getInitials(profile.company_name || profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{profile.company_name || profile.full_name}</h1>
                <p className="text-lg opacity-90">{profile.company_name ? profile.full_name : 'Organiser'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - About & Contact */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.description && (
                  <p className="text-muted-foreground">{profile.description}</p>
                )}
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{profile.attendees_hosted} attendees hosted</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.website_url && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#4B1E25] transition-colors"
                    >
                      {profile.website_url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Exhibitions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Exhibitions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exhibitions.map((exhibition) => (
                    <Card
                      key={exhibition.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                          {exhibition.banner_url ? (
                            <img
                              src={exhibition.banner_url}
                              alt={exhibition.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#4B1E25]/10 flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-[#4B1E25]/20" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold mb-2">{exhibition.title}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{exhibition.city}, {exhibition.state}</span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="mt-4 bg-[#4B1E25]/5 text-[#4B1E25] hover:bg-[#4B1E25]/10"
                        >
                          {exhibition.status.charAt(0).toUpperCase() + exhibition.status.slice(1)}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {exhibitions.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      No exhibitions available at the moment.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 