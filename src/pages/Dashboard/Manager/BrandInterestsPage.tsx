import React, { useState, useEffect } from 'react';
import { useBrandInterests, BrandInterest } from '@/hooks/useBrandInterests';
import { format } from 'date-fns';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Search, 
  Filter, 
  RefreshCw, 
  Inbox, 
  CalendarDays, 
  Mail, 
  Heart,
  Phone,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const BrandInterestsPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExhibition, setSelectedExhibition] = useState<string>('all');
  const [selectedInterest, setSelectedInterest] = useState<BrandInterest | null>(null);
  const [filteredInterests, setFilteredInterests] = useState<BrandInterest[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use the custom hook to fetch brand interests
  const { interests, exhibitions, isLoading, error } = useBrandInterests({
    exhibitionId: selectedExhibition !== 'all' ? selectedExhibition : undefined
  });

  // Filter interests based on search term and selected exhibition
  useEffect(() => {
    filterInterests();
  }, [searchTerm, selectedExhibition, interests]);

  const filterInterests = () => {
    let filtered = [...interests];
    
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(interest => 
        interest.brand?.full_name?.toLowerCase().includes(searchLower) ||
          interest.brand?.company_name?.toLowerCase().includes(searchLower) ||
          interest.exhibition?.title?.toLowerCase().includes(searchLower)
        );
      }

    setFilteredInterests(filtered);
  };

  const handleViewInterest = (interest: BrandInterest) => {
    setSelectedInterest(interest);
  };

  const closeInterestDialog = () => {
    setSelectedInterest(null);
  };

  const navigateToExhibition = (exhibitionId: string) => {
    navigate(`/dashboard/manager/exhibitions/${exhibitionId}`);
  };

  const getDateRangeString = (startDate: string, endDate: string) => {
    try {
    const start = new Date(startDate);
    const end = new Date(endDate);
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    } catch (error) {
      return 'Invalid date range';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <Inbox className="h-5 w-5" />
              <p>Error loading brand interests: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Brand Interests</h1>
          <p className="text-gray-600">View and manage brand interests in exhibitions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
          <Input
                placeholder="Search by brand or exhibition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-[300px]"
          />
        </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
        <Select 
          value={selectedExhibition} 
                onValueChange={setSelectedExhibition}
        >
                <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by exhibition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exhibitions</SelectItem>
            {exhibitions.map((exhibition) => (
              <SelectItem key={exhibition.id} value={exhibition.id}>
                {exhibition.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInterests.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedExhibition !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No brand interests have been recorded yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exhibition</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterests.map((interest) => (
                  <TableRow key={interest.id}>
                    <TableCell>{interest.exhibition?.title}</TableCell>
                    <TableCell>{interest.brand?.company_name}</TableCell>
                    <TableCell>{format(new Date(interest.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{interest.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInterest(interest)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        <Dialog open={!!selectedInterest} onOpenChange={closeInterestDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
              <DialogTitle>Interest Details</DialogTitle>
              <DialogDescription>
              View detailed information about this brand interest
              </DialogDescription>
            </DialogHeader>
          {selectedInterest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Brand Information</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Name:</span>{' '}
                    {selectedInterest.brand?.full_name}
                  </p>
                  <p>
                    <span className="font-medium">Company:</span>{' '}
                    {selectedInterest.brand?.company_name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                  {selectedInterest.brand?.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{' '}
                    {selectedInterest.brand?.phone}
                  </p>
                </div>
              </div>
              
                    <div>
                <h3 className="font-medium">Exhibition Information</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Title:</span>{' '}
                    {selectedInterest.exhibition?.title}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {getDateRangeString(
                      selectedInterest.exhibition?.start_date || '',
                      selectedInterest.exhibition?.end_date || ''
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Venue:</span>{' '}
                    {selectedInterest.exhibition?.venue}
                  </p>
                </div>
                </div>
                
              <div>
                <h3 className="font-medium">Interest Details</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <Badge variant="outline">
                      Pending
                    </Badge>
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{' '}
                    {format(new Date(selectedInterest.created_at), 'MMM d, yyyy')}
                  </p>
                  {selectedInterest.notes && (
                    <div>
                      <p className="font-medium">Notes:</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedInterest.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeInterestDialog}>
              Close
            </Button>
                <Button 
                  onClick={() => {
                if (selectedInterest) {
                  navigateToExhibition(selectedInterest.exhibition_id);
                    }
                  }}
                >
                  View Exhibition
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default BrandInterestsPage; 