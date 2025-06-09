import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Database } from '@/types/database.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, Facebook, Globe, Mail, Phone } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile = () => {
  const { supabase } = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        if (data) {
          setProfile(data as Profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>No profile found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Banner Image */}
      {profile.banner_url && (
        <div className="relative aspect-[3.2/1] w-full overflow-hidden rounded-lg">
          <img
            src={profile.banner_url}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Profile Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{profile.company_name}</h1>
            <p className="text-gray-600">{profile.description}</p>
            
            <div className="space-y-2">
              {profile.website_url && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Website <ExternalLink className="inline h-3 w-3" />
                  </a>
                </div>
              )}
              
              {profile.facebook_url && (
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Facebook <ExternalLink className="inline h-3 w-3" />
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${profile.email}`} className="text-blue-600 hover:underline">
                  {profile.email}
                </a>
              </div>
              
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${profile.phone}`} className="text-blue-600 hover:underline">
                    {profile.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Image */}
          {profile.portfolio_url && (
            <div className="aspect-[1.4/1] overflow-hidden rounded-lg">
              <img
                src={profile.portfolio_url}
                alt="Portfolio"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Gallery Images */}
      {profile.gallery_images && profile.gallery_images.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gallery</h2>
          <Carousel className="w-full">
            <CarouselContent>
              {profile.gallery_images.map((image, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="aspect-[16/9] overflow-hidden rounded-lg">
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </Card>
      )}

      {/* Edit Profile Button */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/organiser/settings">Edit Profile</Link>
        </Button>
      </div>
    </div>
  );
};

export default Profile; 