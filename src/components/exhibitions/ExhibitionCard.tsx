import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Tag, Heart, Image as ImageIcon, Clock, IndianRupee, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { LoginPrompt } from '@/components/auth/LoginPrompt';

interface ExhibitionCardProps {
  exhibition: any;
  isLast?: boolean;
  lastExhibitionRef?: (node: HTMLDivElement | null) => void;
  onNavigate: () => void;
}

export const ExhibitionCard = ({ exhibition, isLast, lastExhibitionRef, onNavigate }: ExhibitionCardProps) => {
  const { 
    isFavorite, 
    isSubmitting, 
    toggleFavorite,
    showLoginPrompt,
    closeLoginPrompt
  } = useExhibitionFavorite(exhibition.id);
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <motion.div
        ref={isLast ? lastExhibitionRef : null}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="group cursor-pointer"
        onClick={onNavigate}
      >
        <Card className="overflow-hidden transform-gpu transition-all duration-300 hover:shadow-xl h-full">
          <div className="relative">
            <AspectRatio ratio={4/3}>
              {imageError ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-font-color-muted" />
                </div>
              ) : (
                <img
                  src={exhibition.banner_image || exhibition.cover_image || '/placeholder-exhibition.jpg'}
                  alt={exhibition.title}
                  className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                  style={{ objectPosition: 'center' }}
                  loading="lazy"
                  onError={handleImageError}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              
              {/* Price Badge */}
              {exhibition.price_range && (
                <div className="absolute top-3 left-3">
                  <div className="bg-white/90 text-black font-medium px-2.5 py-1 rounded-md text-sm">
                    <Badge variant="default">
                      <IndianRupee className="h-3 w-3 mr-1 inline-block" />
                      {exhibition.price_range} onwards
                    </Badge>
                  </div>
                </div>
              )}

              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-700 h-7 w-7 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart 
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                    )} 
                  />
                )}
              </Button>

              {/* Title and Event Type */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold text-base line-clamp-2 mb-2">
                  {exhibition.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exhibition.event_type && (
                    <div className="bg-[#4B1E25] text-[#F5E4DA] rounded-md px-2 py-0.5 text-xs">
                      <Badge variant="default" className="bg-transparent border-none text-[#F5E4DA] hover:bg-transparent">
                        <Tag className="h-3 w-3 mr-1" />
                        {exhibition.event_type.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </AspectRatio>
          </div>

          {/* Details Section */}
          <div className="p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-font-color-muted">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-font-color-muted">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {exhibition.venue_type?.name}, {exhibition.city}
              </span>
            </div>

            {exhibition.timing && (
              <div className="flex items-center gap-1.5 text-xs text-font-color-muted">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{exhibition.timing}</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={closeLoginPrompt}
        message="Please log in to add exhibitions to your favorites."
      />
    </>
  );
};

export default ExhibitionCard; 