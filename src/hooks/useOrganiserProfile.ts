import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganiserProfile {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  description: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  attendees_hosted: number;
  created_at: string;
  updated_at: string;
}

export const useOrganiserProfile = (organiserId: string) => {
  return useQuery<OrganiserProfile>({
    queryKey: ['organiser-profile', organiserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          company_name,
          phone,
          description,
          website_url,
          facebook_url,
          instagram_url,
          twitter_url,
          linkedin_url,
          avatar_url,
          cover_image_url,
          attendees_hosted,
          created_at,
          updated_at
        `)
        .eq('id', organiserId)
        .eq('role', 'organiser')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!organiserId,
  });
}; 