import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';

const ITEMS_PER_PAGE = 5;

const FindExhibitions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exhibitions, setExhibitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchExhibitions();
      fetchCategories();
    }
  }, [user, currentPage]);

  useEffect(() => {
    // Reset to first page when search term or category changes
    setCurrentPage(1);
    if (user) {
      fetchExhibitions();
    }
  }, [searchTerm, category]);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('exhibitions')
        .select(`
          *,
          stalls (
            id,
            stall_applications (
              id,
              status
            )
          )
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }
      if (category !== 'all') {
        query = query.eq('category_id', category);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: exhibitionsData, error: exhibitionsError, count } = await query;

      if (exhibitionsError) throw exhibitionsError;

      // Process the data to count available stalls
      const processedExhibitions = exhibitionsData.map(exhibition => {
        const totalStalls = exhibition.stalls.length;
        const confirmedApplications = exhibition.stalls.reduce((count, stall) => {
          return count + (stall.stall_applications?.some(app => app.status === 'confirmed') ? 1 : 0);
        }, 0);

        return {
          ...exhibition,
          availableStalls: totalStalls - confirmedApplications
        };
      });

      setExhibitions(processedExhibitions || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exhibitions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibition_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Exhibitions</h1>
        <p className="text-gray-600">Browse and apply for upcoming exhibitions</p>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <Input
          placeholder="Search exhibitions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/2"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {exhibitions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No exhibitions found matching your criteria.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {exhibitions.map((exhibition) => (
              <Card key={exhibition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{exhibition.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{exhibition.address}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {exhibition.availableStalls} stalls available
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{exhibition.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {exhibition.price_range}
                      </span>
                      <Button 
                        className="bg-exhibae-navy hover:bg-opacity-90"
                        onClick={() => navigate(`/dashboard/brand/exhibitions/${exhibition.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} exhibitions
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FindExhibitions; 