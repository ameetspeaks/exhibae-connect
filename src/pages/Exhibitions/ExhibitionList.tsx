import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublishedExhibitions, useEventTypes, useVenueTypes } from '@/hooks/useExhibitionsData';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Search, Calendar, MapPin, Users, Heart } from 'lucide-react';
import ExhibitionCard from '@/components/exhibitions/ExhibitionCard';
import { ExhibitionFilters } from '@/components/exhibitions/ExhibitionFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionForm } from '@/components/SubscriptionForm';

const ITEMS_PER_PAGE = 10;

export default function ExhibitionList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: subscription } = useSubscription();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentExhibitionId, setCurrentExhibitionId] = useState<string | null>(null);
  
  const [selectedFilters, setSelectedFilters] = useState({
    eventTypes: [] as string[],
    venueTypes: [] as string[],
    date: null as string | null,
    city: null as string | null,
  });

  const { data: exhibitions = [], isLoading: isLoadingExhibitions, refetch: refetchExhibitions } = usePublishedExhibitions();
  const { data: eventTypes = [], isLoading: isLoadingEventTypes } = useEventTypes();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();
  const { toggleFavorite: toggleFavoriteAction, isSubmitting: isFavoriteSubmitting } = useExhibitionFavorite(currentExhibitionId ?? '');

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters]);

  // Memoize cities list
  const cities = useMemo(() => {
    if (!exhibitions?.length) return [];
    return Array.from(new Set(exhibitions.map(e => e?.city).filter(Boolean))).sort();
  }, [exhibitions]);

  // Memoize filtered exhibitions
  const filteredExhibitions = useMemo(() => {
    if (!exhibitions?.length) return [];
    
    return exhibitions.filter(exhibition => {
      if (!exhibition) return false;

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

  // Calculate pagination
  const totalPages = Math.ceil((filteredExhibitions?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentExhibitions = filteredExhibitions?.slice(startIndex, endIndex);

  const isLoading = isLoadingExhibitions || isLoadingEventTypes || isLoadingVenueTypes;

  // Function to handle favorite toggle
  const handleFavoriteClick = async (e: React.MouseEvent, exhibitionId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking the favorite button
    
    if (!user) {
      navigate('/auth/login');
      return;
    }

    try {
      setCurrentExhibitionId(exhibitionId);
      await toggleFavoriteAction();
      // Refetch exhibitions to update the favorite status
      refetchExhibitions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCurrentExhibitionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-font-color" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Section */}
      <div className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#4B1E25] mb-4">
              Discover Amazing Exhibitions
            </h1>
          <p className="text-lg text-[#4B1E25]/80 max-w-2xl mx-auto">
              Find and participate in the most exciting exhibitions
            </p>
          </div>
        </div>

      {/* Filters Section */}
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="mb-4 bg-[#F5E4DA]">
          <ExhibitionFilters
            eventTypes={eventTypes}
            venueTypes={venueTypes}
            cities={cities}
            onFilterChange={setSelectedFilters}
            exhibitions={exhibitions}
          />
        </div>

        {/* Results Section */}
        <section className="py-8">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentExhibitions?.map((exhibition) => (
                <Card 
                  key={exhibition.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-[#4B1E25]/10 bg-[#F5E4DA]"
                  onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
                >
                  <div className="relative h-48">
                    {exhibition.banner_image || exhibition.cover_image ? (
                      <img
                        src={exhibition.banner_image || exhibition.cover_image}
                        alt={exhibition.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#4B1E25] to-[#F5E4DA] flex items-center justify-center">
                        <h3 className="text-white text-xl font-bold px-4 text-center">{exhibition.title}</h3>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 h-8 w-8 rounded-full"
                      onClick={(e) => handleFavoriteClick(e, exhibition.id)}
                      disabled={isFavoriteSubmitting && currentExhibitionId === exhibition.id}
                    >
                      {isFavoriteSubmitting && currentExhibitionId === exhibition.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 ${exhibition.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                      )}
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3">{exhibition.title}</h3>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{exhibition.address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pagination */}
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-[#F5E4DA] border-[#4B1E25]/20 text-[#4B1E25] hover:bg-[#E6C5B6]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-4 text-[#4B1E25]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-[#F5E4DA] border-[#4B1E25]/20 text-[#4B1E25] hover:bg-[#E6C5B6]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Empty State */}
        {(!filteredExhibitions || filteredExhibitions.length === 0) && (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-semibold mb-2 header-text">
              No Exhibitions Found
            </h3>
            <p className="text-font-color-muted subheading-text">
              Try adjusting your filters or check back later for new exhibitions
            </p>
          </motion.div>
        )}
      </div>

      {/* Newsletter Subscription Section */}
      {!user && !subscription && (
        <section className="py-16 bg-[#F5E4DA]">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#4B1E25] mb-4">
                Never Miss an Exhibition
              </h2>
              <p className="text-[#4B1E25]/80 mb-8">
                Subscribe to our newsletter and be the first to know about upcoming exhibitions and exclusive deals.
              </p>
              <SubscriptionForm variant="minimal" className="max-w-xl mx-auto" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
