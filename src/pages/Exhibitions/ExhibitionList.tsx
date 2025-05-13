import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublishedExhibitions } from '@/hooks/useExhibitionsData';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Filter categories - we can move these to a configuration file later
const categories = [
  { id: 'all', name: 'All' },
  { id: 'art', name: 'Art' },
  { id: 'business', name: 'Business' },
  { id: 'technology', name: 'Technology' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'food', name: 'Food & Beverage' },
  { id: 'lifestyle', name: 'Lifestyle' },
];

const dateFilters = [
  { id: 'all', name: 'All Dates' },
  { id: 'today', name: 'Today' },
  { id: 'tomorrow', name: 'Tomorrow' },
  { id: 'weekend', name: 'This Weekend' },
  { id: 'month', name: 'This Month' },
];

export default function ExhibitionList() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const { data: exhibitions, isLoading } = usePublishedExhibitions();

  // Filter exhibitions based on selected filters
  const filteredExhibitions = exhibitions?.filter(exhibition => {
    if (selectedCategory !== 'all' && exhibition.category?.id !== selectedCategory) {
      return false;
    }
    // Add date filtering logic here
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
      <div className="space-y-6 mb-8">
        {/* Category Filters */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Filters */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Date</h2>
          <div className="flex flex-wrap gap-2">
            {dateFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedDate === filter.id ? "default" : "outline"}
                onClick={() => setSelectedDate(filter.id)}
                className="rounded-full"
              >
                {filter.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Exhibitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredExhibitions?.map((exhibition) => (
          <Card 
            key={exhibition.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
          >
            <AspectRatio ratio={3/2}>
              <img
                src={exhibition.banner_image || '/placeholder-exhibition.jpg'}
                alt={exhibition.title}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
            <CardContent className="p-4">
              <div className="space-y-2">
                {exhibition.category && (
                  <Badge variant="outline" className="mb-2">
                    <Tag className="w-3 h-3 mr-1" />
                    {exhibition.category.name}
                  </Badge>
                )}
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
        ))}
      </div>

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
