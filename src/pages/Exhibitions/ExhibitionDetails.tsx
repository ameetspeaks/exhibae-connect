import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { Exhibition } from '@/types/exhibition';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!exhibition) {
    return <div>Exhibition not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {exhibition.banner_url && (
          <img 
            src={exhibition.banner_url} 
            alt={exhibition.name}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}
        
        <h1 className="text-3xl font-bold mb-4">{exhibition.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <div className="prose max-w-none">
              <p>{exhibition.description}</p>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Date & Time</h3>
                <p>
                  {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Location</h3>
                <p>{exhibition.location}</p>
                {exhibition.venue_details && (
                  <p className="text-sm text-gray-600">{exhibition.venue_details}</p>
                )}
              </div>
              
              {exhibition.price && (
                <div>
                  <h3 className="text-lg font-semibold">Price</h3>
                  <p>
                    {exhibition.currency || '£'}{exhibition.price}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Organiser</h3>
              <div className="flex items-center space-x-4 mb-4">
                {exhibition.organiser.avatar_url && (
                  <img 
                    src={exhibition.organiser.avatar_url} 
                    alt={exhibition.organiser.full_name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{exhibition.organiser.full_name}</p>
                  {exhibition.organiser.company_name && (
                    <p className="text-sm text-gray-600">{exhibition.organiser.company_name}</p>
                  )}
                </div>
              </div>
              
              {user ? (
                hasRegisteredInterest ? (
                  <Button className="w-full" disabled>
                    Interest Registered
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleRegisterInterest}
                    disabled={isSubmitting || !userProfile}
                  >
                    {isSubmitting ? "Registering..." : "Register Interest"}
                  </Button>
                )
              ) : (
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  Sign in to Register Interest
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 