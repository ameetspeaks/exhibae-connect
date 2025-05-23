import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublishedExhibitions, useEventTypes, useVenueTypes } from '@/hooks/useExhibitionsData';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Tag, Map, Search, Loader2, Heart } from 'lucide-react';
import { ExhibitionFilters } from '@/components/exhibitions/ExhibitionFilters';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';

const ITEMS_PER_PAGE = 10;

export default function ExhibitionList() {
  const navigate = useNavigate();
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const loadingRef = useRef(null);
  
  const [selectedFilters, setSelectedFilters] = useState({
    eventTypes: [] as string[],
    venueTypes: [] as string[],
    date: null as string | null,
    city: null as string | null,
  });

  const { data: exhibitions = [], isLoading: isLoadingExhibitions } = usePublishedExhibitions();
  const { data: eventTypes = [], isLoading: isLoadingEventTypes } = useEventTypes();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();

  // Debug logging
  useEffect(() => {
    console.log('Event Types:', eventTypes);
    console.log('Selected Filters:', selectedFilters);
    console.log('Exhibitions:', exhibitions);
  }, [eventTypes, selectedFilters, exhibitions]);

  // Memoize cities list to prevent unnecessary recalculations
  const cities = useMemo(() => {
    if (!exhibitions) return [];
    return Array.from(new Set(exhibitions.map(e => e.city).filter(Boolean))).sort();
  }, [exhibitions]);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [selectedFilters]);

  // Memoize filtered exhibitions to prevent unnecessary recalculations
  const filteredExhibitions = useMemo(() => {
    return exhibitions?.filter(exhibition => {
      // Event Type filter
      if (selectedFilters.eventTypes.length > 0) {
        if (!exhibition.event_type || !selectedFilters.eventTypes.includes(exhibition.event_type.id)) {
          return false;
        }
      }

      // Venue Type filter
      if (selectedFilters.venueTypes.length > 0) {
        if (!exhibition.venue_type || !selectedFilters.venueTypes.includes(exhibition.venue_type.id)) {
          return false;
        }
      }

      // Date filter
      if (selectedFilters.date) {
        const startDate = parseISO(exhibition.start_date);
        const endDate = parseISO(exhibition.end_date);
        const today = new Date();

        switch (selectedFilters.date) {
          case 'today':
            if (!isToday(startDate) && !(startDate <= today && endDate >= today)) {
              return false;
            }
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (!isTomorrow(startDate) && !(startDate <= tomorrow && endDate >= tomorrow)) {
              return false;
            }
            break;
          case 'this-week':
            if (!isThisWeek(startDate) && !(startDate <= today && endDate >= today)) {
              return false;
            }
            break;
          default:
            // For specific date selection
            const selectedDate = parseISO(selectedFilters.date);
            if (!(startDate <= selectedDate && endDate >= selectedDate)) {
              return false;
            }
        }
      }

      // City filter
      if (selectedFilters.city && exhibition.city !== selectedFilters.city) {
        return false;
      }

      return true;
    });
  }, [exhibitions, selectedFilters]);

  // Intersection Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastExhibitionRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingExhibitions) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && filteredExhibitions && visibleItems < filteredExhibitions.length) {
        setVisibleItems(prev => Math.min(prev + ITEMS_PER_PAGE, filteredExhibitions.length));
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingExhibitions, filteredExhibitions, visibleItems]);

  if (isLoadingExhibitions || isLoadingEventTypes || isLoadingVenueTypes) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const visibleExhibitions = filteredExhibitions?.slice(0, visibleItems);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Exhibitions</h1>
        <p className="text-muted-foreground mt-2">
          Discover and book your spot at upcoming exhibitions
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-8">
        <ExhibitionFilters
          eventTypes={eventTypes}
          venueTypes={venueTypes}
          cities={cities}
          onFilterChange={setSelectedFilters}
        />
      </div>

      {/* Exhibitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleExhibitions?.map((exhibition, index) => (
          <ExhibitionCard 
            key={exhibition.id}
            exhibition={exhibition}
            isLast={index === visibleExhibitions.length - 1}
            lastExhibitionRef={lastExhibitionRef}
            onNavigate={() => navigate(`/exhibitions/${exhibition.id}`)}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {visibleItems < (filteredExhibitions?.length || 0) && (
        <div 
          ref={loadingRef}
          className="flex justify-center py-8"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {(!filteredExhibitions || filteredExhibitions.length === 0) && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No Exhibitions Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new exhibitions
          </p>
        </div>
      )}
    </div>
  );
}

interface ExhibitionCardProps {
  exhibition: any;
  isLast: boolean;
  lastExhibitionRef: React.RefObject<HTMLDivElement>;
  onNavigate: () => void;
}

const ExhibitionCard = ({ exhibition, isLast, lastExhibitionRef, onNavigate }: ExhibitionCardProps) => {
  const { isFavorite, toggleFavorite, isSubmitting } = useExhibitionFavorite(exhibition.id);

  return (
    <Card 
      ref={isLast ? lastExhibitionRef : null}
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={onNavigate}
    >
      <AspectRatio ratio={3/2}>
        <img
          src={exhibition.banner_image || '/placeholder-exhibition.jpg'}
          alt={exhibition.title}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 h-8 w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          )}
        </Button>
      </AspectRatio>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {exhibition.event_type && (
              <Badge variant="outline">
                <Tag className="w-3 h-3 mr-1" />
                {exhibition.event_type.name}
              </Badge>
            )}
            {exhibition.venue_type && (
              <Badge variant="outline">
                {exhibition.venue_type.name}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold line-clamp-2">{exhibition.title}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{exhibition.city}, {exhibition.state}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
