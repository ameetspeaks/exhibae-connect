import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Brand {
  id: string;
  user_metadata: {
    company_name: string;
    logo_url?: string;
    description?: string;
  };
  email: string;
}

const BrandList = () => {
  const navigate = useNavigate();

  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_name, avatar_url, role')
          .eq('role', 'brand');

        if (error) throw error;
        
        // Map profile data to the expected Brand structure
        return (data || []).map(profile => ({
          id: profile.id,
          email: profile.email,
          user_metadata: {
            company_name: profile.company_name || 'Brand Name',
            logo_url: profile.avatar_url,
            description: ''
          }
        }));
      } catch (err) {
        console.error('Error fetching brands:', err);
        throw err;
      }
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Featured Brands</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover and connect with innovative brands showcasing their unique products and collections
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {brands?.map((brand) => (
          <Card 
            key={brand.id}
            className="group cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate(`/brands/${brand.id}`)}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4 relative">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage 
                    src={brand.user_metadata.logo_url} 
                    alt={brand.user_metadata.company_name} 
                  />
                  <AvatarFallback className="text-2xl">
                    {getInitials(brand.user_metadata.company_name || 'Brand Name')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {brand.user_metadata.company_name || 'Brand Name'}
              </h3>
              {brand.user_metadata.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {brand.user_metadata.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BrandList; 