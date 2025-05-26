import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Tag, Heart, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';

interface ExhibitionCardProps {
  exhibition: any;
  isLast: boolean;
  lastExhibitionRef: (node: HTMLDivElement | null) => void;
  onNavigate: () => void;
}

export const ExhibitionCard = ({ exhibition, isLast, lastExhibitionRef, onNavigate }: ExhibitionCardProps) => {
  const { isFavorite, toggleFavorite, isSubmitting } = useExhibitionFavorite(exhibition.id);
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <motion.div
      ref={isLast ? lastExhibitionRef : null}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, rotateY: 2 }}
      className="group cursor-pointer"
      onClick={onNavigate}
    >
      <Card className="overflow-hidden bg-white dark:bg-gray-800 transform-gpu transition-all duration-300 hover:shadow-xl h-full">
        <div className="relative">
          <AspectRatio ratio={4/3}>
            {imageError ? (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
            ) : (
              <img
                src={exhibition.banner_image || exhibition.cover_image || '/placeholder-exhibition.jpg'}
                alt={exhibition.title}
                className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                style={{
                  objectPosition: 'center',
                }}
                loading="lazy"
                onError={handleImageError}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </AspectRatio>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors z-10",
              isFavorite && "text-red-500 hover:text-red-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
            disabled={isSubmitting}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </Button>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
              {exhibition.title}
            </h3>
            <div className="flex items-center gap-1.5 text-white/90 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{exhibition.city}, {exhibition.state}</span>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">
              {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {exhibition.event_type && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs py-0.5">
                <Tag className="h-3 w-3" />
                {exhibition.event_type.name}
              </Badge>
            )}
            {exhibition.venue_type && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs py-0.5">
                <MapPin className="h-3 w-3" />
                {exhibition.venue_type.name}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ExhibitionCard; 