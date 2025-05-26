import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublishedExhibitions, useEventTypes, useVenueTypes } from '@/hooks/useExhibitionsData';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ExhibitionCard from '@/components/exhibitions/ExhibitionCard';
import { ExhibitionFilters } from '@/components/exhibitions/ExhibitionFilters';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;

export default function ExhibitionList() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedFilters, setSelectedFilters] = useState({
    eventTypes: [] as string[],
    venueTypes: [] as string[],
    date: null as string | null,
    city: null as string | null,
  });

  const { data: exhibitions = [], isLoading: isLoadingExhibitions } = usePublishedExhibitions();
  const { data: eventTypes = [], isLoading: isLoadingEventTypes } = useEventTypes();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Discover Exhibitions
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Find and book your spot at the most exciting exhibitions
          </p>
        </motion.div>

        {/* Filters Section */}
        <div className="mb-6">
          <ExhibitionFilters
            eventTypes={eventTypes}
            venueTypes={venueTypes}
            cities={cities}
            onFilterChange={setSelectedFilters}
            exhibitions={exhibitions}
          />
        </div>

        {/* Exhibitions Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {currentExhibitions?.map((exhibition) => (
              <ExhibitionCard
                key={exhibition.id}
                exhibition={exhibition}
                isLast={false}
                lastExhibitionRef={() => {}}
                onNavigate={() => navigate(`/exhibitions/${exhibition.id}`)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[32px]"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {(!filteredExhibitions || filteredExhibitions.length === 0) && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No Exhibitions Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your filters or check back later for new exhibitions
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
