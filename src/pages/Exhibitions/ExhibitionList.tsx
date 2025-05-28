import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublishedExhibitions, useEventTypes, useVenueTypes } from '@/hooks/useExhibitionsData';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Search, Calendar, MapPin, Users } from 'lucide-react';
import ExhibitionCard from '@/components/exhibitions/ExhibitionCard';
import { ExhibitionFilters } from '@/components/exhibitions/ExhibitionFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 10;

export default function ExhibitionList() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
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
        <Loader2 className="h-8 w-8 animate-spin text-font-color" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Section */}
      <section className="bg-[#F5E4DA] py-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Amazing Exhibitions
            </h1>
            <p className="text-xl text-gray-600">
              Find and participate in the most exciting exhibitions across various industries
            </p>
          </div>
        </div>
      </section>

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
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 mx-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] ${currentPage === page ? 'bg-[#4B1E25] text-[#F5E4DA]' : 'border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]'}`}
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
              className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

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
    </div>
  );
}
