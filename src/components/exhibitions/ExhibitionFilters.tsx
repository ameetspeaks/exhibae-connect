import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Tag, X } from 'lucide-react';

interface ExhibitionFiltersProps {
  eventTypes: Array<{ id: string; name: string }>;
  venueTypes: Array<{ id: string; name: string }>;
  cities: string[];
  onFilterChange: (filters: {
    eventTypes: string[];
    venueTypes: string[];
    date: string | null;
    city: string | null;
  }) => void;
  exhibitions?: any[]; // Make exhibitions optional
}

export const ExhibitionFilters = ({
  eventTypes = [], // Provide default empty array
  venueTypes = [], // Provide default empty array
  cities = [], // Provide default empty array
  onFilterChange,
  exhibitions = [], // Provide default empty array
}: ExhibitionFiltersProps) => {
  const [selectedFilters, setSelectedFilters] = React.useState({
    eventTypes: [] as string[],
    venueTypes: [] as string[],
    date: null as string | null,
    city: null as string | null,
  });

  // Get used event types and venue types
  const usedEventTypeIds = React.useMemo(() => {
    return Array.from(new Set(exhibitions.map(e => e?.event_type?.id).filter(Boolean)));
  }, [exhibitions]);

  const usedVenueTypeIds = React.useMemo(() => {
    return Array.from(new Set(exhibitions.map(e => e?.venue_type?.id).filter(Boolean)));
  }, [exhibitions]);

  // Filter event types and venue types to only show used ones
  const filteredEventTypes = React.useMemo(() => {
    return eventTypes.filter(type => usedEventTypeIds.includes(type.id));
  }, [eventTypes, usedEventTypeIds]);

  const filteredVenueTypes = React.useMemo(() => {
    return venueTypes.filter(type => usedVenueTypeIds.includes(type.id));
  }, [venueTypes, usedVenueTypeIds]);

  const handleFilterChange = (type: string, value: any) => {
    let newFilters;
    if (type === 'eventTypes' || type === 'venueTypes') {
      newFilters = {
        ...selectedFilters,
        [type]: selectedFilters[type].includes(value)
          ? selectedFilters[type].filter(t => t !== value)
          : [...selectedFilters[type], value],
      };
    } else {
      newFilters = {
        ...selectedFilters,
        [type]: value,
      };
    }
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      eventTypes: [],
      venueTypes: [],
      date: null,
      city: null,
    };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.values(selectedFilters).some(
    value => Array.isArray(value) ? value.length > 0 : value !== null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Event Types - show only if there are used event types */}
          {filteredEventTypes.length > 0 && (
            <div className="lg:col-span-4">
              <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Event Types
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-white/50 dark:bg-gray-900/50 rounded-lg p-2">
                {filteredEventTypes.map(type => (
                  <Badge
                    key={type.id}
                    variant={selectedFilters.eventTypes.includes(type.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90 transition-colors text-xs py-1"
                    onClick={() => handleFilterChange('eventTypes', type.id)}
                  >
                    {type.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Venue Types - show only if there are used venue types */}
          {filteredVenueTypes.length > 0 && (
            <div className="lg:col-span-4">
              <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Venue Types
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-white/50 dark:bg-gray-900/50 rounded-lg p-2">
                {filteredVenueTypes.map(type => (
                  <Badge
                    key={type.id}
                    variant={selectedFilters.venueTypes.includes(type.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90 transition-colors text-xs py-1"
                    onClick={() => handleFilterChange('venueTypes', type.id)}
                  >
                    {type.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Date and City Filters */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </label>
              <Select
                value={selectedFilters.date || "all"}
                onValueChange={value => handleFilterChange('date', value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full bg-white/50 dark:bg-gray-900/50">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any date</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cities.length > 0 && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  City
                </label>
                <Select
                  value={selectedFilters.city || "all"}
                  onValueChange={value => handleFilterChange('city', value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-gray-900/50">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any city</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-1 flex items-end justify-end lg:justify-start">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ExhibitionFilters; 