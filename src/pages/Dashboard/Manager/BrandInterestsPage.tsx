import React, { useState, useEffect } from 'react';
import { useBrandInterests, BrandInterest } from '@/hooks/useBrandInterests';
import { format } from 'date-fns';
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
  Heart 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const BrandInterestsPage = () => {
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

  // Only call setFilteredInterests once when interests change
  useEffect(() => {
    console.log("[BrandInterestsPage] Interests changed:", interests.length);
    filterInterests();
  }, [interests, searchTerm]);

  const filterInterests = () => {
    console.log("[BrandInterestsPage] Filtering interests with searchTerm:", searchTerm);
    const filtered = interests.filter((interest) => {
      // Search term filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          interest.brand?.company_name?.toLowerCase().includes(searchLower) ||
          interest.brand?.full_name?.toLowerCase().includes(searchLower) ||
          interest.brand?.email?.toLowerCase().includes(searchLower) ||
          interest.exhibition?.title?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    console.log("[BrandInterestsPage] Filtered interests count:", filtered.length);
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Same year
    if (start.getFullYear() === end.getFullYear()) {
      // Same month
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      } else {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    } else {
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brand Interests</h1>
          <p className="text-muted-foreground">
            View and manage all brand interests in exhibitions
          </p>
        </div>
        <Button
          onClick={() => {
            // Force a component re-render which will trigger a refetch
            setSelectedExhibition(selectedExhibition);
            toast({
              title: 'Refreshing',
              description: 'Updating brand interests list...'
            });
          }}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search interests..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select 
          value={selectedExhibition} 
          onValueChange={(value) => setSelectedExhibition(value)}
        >
          <SelectTrigger className="w-[250px]">
            <Filter className="h-4 w-4 mr-2" />
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

      {/* Interests Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Brand Interests</CardTitle>
          <CardDescription>
            {filteredInterests.length} interests found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInterests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No interests found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedExhibition !== 'all'
                  ? 'Try adjusting your filters'
                  : 'When brands show interest in exhibitions, they will appear here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Exhibition</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Interest Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterests.map((interest) => (
                  <TableRow key={interest.id}>
                    <TableCell>
                      <div className="font-medium">{interest.brand?.company_name}</div>
                      <div className="text-sm text-muted-foreground">{interest.brand?.full_name}</div>
                    </TableCell>
                    <TableCell>
                      {interest.exhibition?.title}
                    </TableCell>
                    <TableCell>
                      {interest.exhibition?.start_date && interest.exhibition?.end_date ? 
                        getDateRangeString(interest.exhibition.start_date, interest.exhibition.end_date) : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(interest.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInterest(interest)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Interest Detail Dialog */}
      {selectedInterest && (
        <Dialog open={!!selectedInterest} onOpenChange={closeInterestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Interest Details</DialogTitle>
              <DialogDescription>
                Brand interest information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Brand Information */}
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-3">Brand Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{selectedInterest.brand?.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Name</p>
                    <p className="font-medium">{selectedInterest.brand?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedInterest.brand?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedInterest.brand?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Exhibition Information */}
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-3">Exhibition Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Exhibition Name</p>
                    <p className="font-medium">{selectedInterest.exhibition?.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Range</p>
                    <p className="font-medium">
                      {selectedInterest.exhibition?.start_date && selectedInterest.exhibition?.end_date ? 
                        getDateRangeString(selectedInterest.exhibition.start_date, selectedInterest.exhibition.end_date) : 
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{selectedInterest.exhibition?.venue_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedInterest.exhibition?.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="line-clamp-3">{selectedInterest.exhibition?.description || 'No description available.'}</p>
                  </div>
                </div>
              </div>
              
              {/* Interest Information */}
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-3">Interest Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Date Registered</p>
                    <p className="font-medium">{format(new Date(selectedInterest.created_at), 'PPpp')}</p>
                  </div>
                  
                  {selectedInterest.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="whitespace-pre-line">{selectedInterest.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <Button 
                  variant="default"
                  onClick={() => {
                    if (selectedInterest.exhibition?.id) {
                      navigateToExhibition(selectedInterest.exhibition.id);
                    }
                  }}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  View Exhibition
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedInterest.brand?.email) {
                      window.location.href = `mailto:${selectedInterest.brand.email}?subject=Your interest in ${selectedInterest.exhibition?.title || 'our exhibition'}`;
                    }
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Brand
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BrandInterestsPage; 