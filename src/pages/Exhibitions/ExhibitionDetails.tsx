import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { Exhibition } from '@/types/exhibition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Heart, Loader2, Building2, Users, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { Skeleton } from '@/components/ui/skeleton';
import { useGalleryImages } from '@/hooks/useGalleryData';

export default function ExhibitionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string } | null>(null);
  const { isFavorite, toggleFavorite, isSubmitting: isFavoriteSubmitting } = useExhibitionFavorite(id || '');
  const { data: galleryImages, isLoading: isLoadingGallery } = useGalleryImages(id || '');

  // Fetch user's profile ID
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchExhibition = async () => {
      try {
        const { data, error } = await supabase
          .from('exhibitions')
          .select(`
            *,
            organiser:profiles!exhibitions_organiser_id_fkey(
              id,
              full_name,
              company_name,
              avatar_url,
              email
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setExhibition(data);
      } catch (error) {
        console.error('Error fetching exhibition:', error);
        toast({
          title: 'Error',
          description: 'Failed to load exhibition details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExhibition();
    }
  }, [id, supabase]);

  // Check if user has already registered interest
  useEffect(() => {
    const checkInterestStatus = async () => {
      if (!userProfile || !exhibition) return;

      try {
        const { data, error } = await supabase
          .from('exhibition_interests')
          .select('id')
          .eq('exhibition_id', id)
          .eq('brand_id', userProfile.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }

        setHasRegisteredInterest(!!data);
      } catch (error) {
        console.error('Error checking interest status:', error);
      }
    };

    checkInterestStatus();
  }, [userProfile, id, exhibition]);

  const handleRegisterInterest = async () => {
    if (!userProfile || !exhibition) return;

    setIsSubmitting(true);
    try {
      // First, check if interest already exists
      const { data: existingInterest, error: checkError } = await supabase
        .from('exhibition_interests')
        .select('id')
        .eq('exhibition_id', exhibition.id)
        .eq('brand_id', userProfile.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingInterest) {
        setHasRegisteredInterest(true);
        return;
      }

      // Register interest
      const { error: insertError } = await supabase
        .from('exhibition_interests')
        .insert([
          {
            exhibition_id: exhibition.id,
            brand_id: userProfile.id,
            notes: '' // Optional notes can be added later if needed
          }
        ]);

      if (insertError) throw insertError;

      setHasRegisteredInterest(true);
      toast({
        title: "Interest Registered",
        description: "Your interest has been registered successfully.",
      });

      // Initiate conversation with organizer
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert([
          {
            brand_id: userProfile.id,
            organiser_id: exhibition.organiser.id,
            exhibition_id: exhibition.id,
            exhibition_name: exhibition.name,
            messages: [{
              id: crypto.randomUUID(),
              sender_id: userProfile.id,
              content: `Hi, I'm interested in your exhibition "${exhibition.name}"`,
              created_at: new Date().toISOString(),
              is_read: false,
              read_at: null
            }]
          }
        ])
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Navigate to the messages page with the new conversation
      navigate(`/dashboard/brand/messages?conversation=${newConversation.id}`);
    } catch (error: any) {
      console.error('Error registering interest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register interest",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoadingGallery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="w-full h-64 rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <Skeleton className="h-[200px] w-full" />
            </div>
            <div>
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Exhibition not found</h2>
        <p className="text-muted-foreground mb-6">The exhibition you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const bannerImage = galleryImages?.find(img => img.image_type === 'banner')?.image_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="relative mb-8 group">
            <AspectRatio ratio={21/9}>
              <img 
                src={bannerImage || '/placeholder-banner.jpg'} 
                alt={exhibition.name}
                className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </AspectRatio>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded-2xl" />
            
            {/* Favorite Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/95 hover:bg-white shadow-lg border-0 backdrop-blur-sm flex items-center gap-2 px-4 rounded-full transition-all duration-300 hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite();
                }}
                disabled={isFavoriteSubmitting}
              >
                {isFavoriteSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Heart className={`h-4 w-4 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-700 hover:scale-110'}`} />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </span>
              </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                  {exhibition.name}
                </h1>
                <div className="flex flex-wrap gap-3">
                  {exhibition.category && (
                    <Badge variant="secondary" className="bg-white/90 hover:bg-white text-primary px-4 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105">
                      <Info className="w-4 h-4 mr-1.5" />
                      {exhibition.category}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/90 hover:bg-white text-primary px-4 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {exhibition.location}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/90 hover:bg-white text-primary px-4 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="mb-6 p-1 bg-white/50 backdrop-blur-sm rounded-full border shadow-sm">
                  <TabsTrigger value="about" className="rounded-full text-sm">About</TabsTrigger>
                  <TabsTrigger value="details" className="rounded-full text-sm">Details</TabsTrigger>
                  <TabsTrigger value="organiser" className="rounded-full text-sm">Organiser</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about">
                  <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>About the Exhibition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {exhibition.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details">
                  <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Exhibition Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg mb-1">Date & Time</p>
                          <p className="text-muted-foreground">
                            Start: {format(new Date(exhibition.start_date), 'MMMM d, yyyy')}<br />
                            End: {format(new Date(exhibition.end_date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg mb-1">Location</p>
                          <p className="text-muted-foreground">
                            {exhibition.location}
                            {exhibition.venue_details && (
                              <>
                                <br />
                                {exhibition.venue_details}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {exhibition.max_brands && (
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg mb-1">Maximum Brands</p>
                            <p className="text-muted-foreground">{exhibition.max_brands} brands</p>
                          </div>
                        </div>
                      )}

                      {exhibition.price && (
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg mb-1">Price</p>
                            <p className="text-muted-foreground">
                              {exhibition.currency || '£'}{exhibition.price}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="organiser">
                  <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Organiser Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 p-4 bg-primary/5 rounded-xl">
                        {exhibition.organiser.avatar_url ? (
                          <img
                            src={exhibition.organiser.avatar_url}
                            alt={exhibition.organiser.full_name}
                            className="w-20 h-20 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center shadow-md">
                            <Users className="w-10 h-10 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-xl mb-2 text-primary">
                            {exhibition.organiser.company_name || exhibition.organiser.full_name}
                          </h3>
                          {exhibition.organiser.email && (
                            <p className="text-muted-foreground flex items-center gap-2">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" />
                              {exhibition.organiser.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm sticky top-24">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <div className="space-y-4">
                      {hasRegisteredInterest ? (
                        <Button className="w-full bg-green-500 hover:bg-green-600" disabled>
                          Interest Registered
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 transition-all duration-300"
                          onClick={handleRegisterInterest}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Register Interest'
                          )}
                        </Button>
                      )}
                      <Separator className="bg-primary/10" />
                      <Button
                        variant="outline"
                        className="w-full border-primary/20 hover:bg-primary/5 transition-all duration-300"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite();
                        }}
                        disabled={isFavoriteSubmitting}
                      >
                        {isFavoriteSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Heart className={`mr-2 h-4 w-4 transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        )}
                        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Please sign in to register interest or favorite this exhibition.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-primary/20 hover:bg-primary/5 transition-all duration-300"
                        onClick={() => navigate('/auth/login')}
                      >
                        Sign In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 