import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, MapPin, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

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
}

export function ExhibitionFilters({
  eventTypes,
  venueTypes,
  cities,
  onFilterChange,
}: ExhibitionFiltersProps) {
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showAllEventTypes, setShowAllEventTypes] = useState(false);
  const [showAllVenueTypes, setShowAllVenueTypes] = useState(false);

  // Combine all filter changes into a single effect
  useEffect(() => {
    const filters = {
      eventTypes: selectedEventTypes,
      venueTypes: selectedVenueTypes,
      date: dateFilter || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null),
      city: selectedCity,
    };
    onFilterChange(filters);
  }, [selectedEventTypes, selectedVenueTypes, dateFilter, selectedDate, selectedCity, onFilterChange]);

  const toggleEventType = (id: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleVenueType = (id: string) => {
    setSelectedVenueTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleDateOptionSelect = (option: string) => {
    setDateFilter(option);
    setSelectedDate(null);
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
    setSelectedVenueTypes([]);
    setSelectedDate(null);
    setDateFilter(null);
    setSelectedCity(null);
  };

  const hasActiveFilters = selectedEventTypes.length > 0 || 
    selectedVenueTypes.length > 0 || 
    dateFilter !== null || 
    selectedDate !== null || 
    selectedCity !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Event Type Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Event Type</h3>
          <div className="flex flex-wrap gap-2">
            {eventTypes
              .slice(0, showAllEventTypes ? undefined : 5)
              .map((type) => (
                <Badge
                  key={type.id}
                  variant={selectedEventTypes.includes(type.id) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleEventType(type.id)}
                >
                  {type.name}
                </Badge>
              ))}
            {eventTypes.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllEventTypes(!showAllEventTypes)}
              >
                {showAllEventTypes ? (
                  <>
                    Show Less <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Venue Type Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Venue Type</h3>
          <div className="flex flex-wrap gap-2">
            {venueTypes
              .slice(0, showAllVenueTypes ? undefined : 5)
              .map((type) => (
                <Badge
                  key={type.id}
                  variant={selectedVenueTypes.includes(type.id) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleVenueType(type.id)}
                >
                  {type.name}
                </Badge>
              ))}
            {venueTypes.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllVenueTypes(!showAllVenueTypes)}
              >
                {showAllVenueTypes ? (
                  <>
                    Show Less <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                (dateFilter || selectedDate) && 'text-primary'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter === 'today' && 'Today'}
              {dateFilter === 'tomorrow' && 'Tomorrow'}
              {dateFilter === 'this-week' && 'This Week'}
              {selectedDate && format(selectedDate, 'PPP')}
              {!dateFilter && !selectedDate && 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleDateOptionSelect('today')}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleDateOptionSelect('tomorrow')}
              >
                Tomorrow
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleDateOptionSelect('this-week')}
              >
                This Week
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setDateFilter(null);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* City Filter */}
        <Select
          value={selectedCity || "all"}
          onValueChange={(value) => setSelectedCity(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.filter(Boolean).map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
} 