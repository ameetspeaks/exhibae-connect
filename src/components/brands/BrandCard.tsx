import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useBrandFavorite } from '@/hooks/useBrandFavorite';
import { LoginPrompt } from '@/components/auth/LoginPrompt';

interface Brand {
  id: string;
  user_id: string;
  company_name: string;
  avatar_url?: string;
  description?: string;
}

interface BrandCardProps {
  brand: Brand;
  onNavigate?: () => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onNavigate }) => {
  const { 
    toggleFavorite, 
    isSubmitting,
    showLoginPrompt,
    closeLoginPrompt
  } = useBrandFavorite(brand.user_id);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4" onClick={onNavigate}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={brand.avatar_url} alt={brand.company_name} />
                <AvatarFallback className="bg-[#4B1E25] text-[#F5E4DA]">
                  {getInitials(brand.company_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-[#4B1E25] line-clamp-1 hover:text-[#4B1E25]/80 transition-colors">
                  {brand.company_name}
                </h3>
                {brand.description && (
                  <p className="text-sm text-[#4B1E25]/60 line-clamp-1">
                    {brand.description}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#4B1E25] hover:text-[#4B1E25]/80"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Heart className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={closeLoginPrompt}
        message="Please log in to add brands to your favorites."
      />
    </>
  );
}; 