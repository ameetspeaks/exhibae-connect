import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Exhibition {
  id: string;
  title: string;
  organiser: {
    full_name: string;
  };
  venue_type: {
    name: string;
  };
  city: string;
  state: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

const getStatusDisplay = (status: Exhibition['status']) => {
  if (status === 'draft') {
    return 'Pending for Approval';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const ExhibitionsPage = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exhibitionToDelete, setExhibitionToDelete] = useState<Exhibition | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<{exhibitionId: string, newStatus: Exhibition['status'], currentTitle: string} | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exhibitions')
        .select(`
          id,
          title,
          organiser:organiser_id(full_name),
          venue_type:venue_type_id(name),
          city,
          state,
          start_date,
          end_date,
          status
        `)
        .order('created_at', { ascending: false })
        .returns<Exhibition[]>();

      if (error) throw error;

      setExhibitions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch exhibitions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExhibitionStatus = async (exhibitionId: string, newStatus: Exhibition['status']) => {
    try {
      setUpdatingStatus(exhibitionId);
      
      // Get the exhibition details before updating
      const { data: exhibitionData, error: fetchError } = await supabase
        .from('exhibitions')
        .select('title, organiser_id, status')
        .eq('id', exhibitionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the exhibition status
      const { error } = await supabase
        .from('exhibitions')
        .update({ status: newStatus })
        .eq('id', exhibitionId);

      if (error) throw error;

      // Create a notification for the organizer
      if (exhibitionData && exhibitionData.status !== newStatus) {
        // Create notification for the organizer
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: exhibitionData.organiser_id,
              title: 'Exhibition Status Updated',
              message: `Your exhibition "${exhibitionData.title}" status has been changed to ${getStatusDisplay(newStatus)}.`,
              type: 'exhibition_updated',
              link: `/dashboard/organiser/exhibitions/${exhibitionId}`,
              is_read: false,
            },
          ]);

        if (notificationError) {
          console.error('Failed to create notification:', notificationError);
        }
      }

      setExhibitions(exhibitions.map(exhibition => 
        exhibition.id === exhibitionId 
          ? { ...exhibition, status: newStatus }
          : exhibition
      ));

      toast({
        title: 'Success',
        description: 'Exhibition status updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update exhibition status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeVariant = (status: Exhibition['status']) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch = (
      exhibition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.organiser.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.state.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || exhibition.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (exhibition: Exhibition) => {
    setExhibitionToDelete(exhibition);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!exhibitionToDelete) return;

    try {
      const { error } = await supabase
        .from('exhibitions')
        .delete()
        .eq('id', exhibitionToDelete.id);

      if (error) throw error;

      setExhibitions(exhibitions.filter(e => e.id !== exhibitionToDelete.id));
      toast({
        title: 'Success',
        description: 'Exhibition deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete exhibition',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setExhibitionToDelete(null);
    }
  };

  const handleStatusChange = async (exhibitionId: string, newStatus: Exhibition['status']) => {
    // Find the exhibition
    const exhibition = exhibitions.find(e => e.id === exhibitionId);
    if (!exhibition) return;
    
    // If the status is being changed to cancelled or completed, confirm first
    if (newStatus === 'cancelled' || newStatus === 'completed') {
      setStatusUpdateData({
        exhibitionId,
        newStatus,
        currentTitle: exhibition.title
      });
      setStatusUpdateDialog(true);
    } else {
      // Otherwise just update the status
      updateExhibitionStatus(exhibitionId, newStatus);
    }
  };

  const confirmStatusUpdate = () => {
    if (!statusUpdateData) return;
    
    updateExhibitionStatus(statusUpdateData.exhibitionId, statusUpdateData.newStatus);
    setStatusUpdateDialog(false);
    setStatusUpdateData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading exhibitions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exhibitions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exhibitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exhibitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Pending for Approval</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organiser</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading exhibitions...
                    </TableCell>
                  </TableRow>
                ) : filteredExhibitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No exhibitions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExhibitions.map((exhibition) => (
                    <TableRow key={exhibition.id}>
                      <TableCell className="font-medium">{exhibition.title}</TableCell>
                      <TableCell>{exhibition.organiser.full_name}</TableCell>
                      <TableCell>{`${exhibition.city}, ${exhibition.state}`}</TableCell>
                      <TableCell>
                        {exhibition.start_date && format(new Date(exhibition.start_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(exhibition.status)} className="mr-2">
                            {getStatusDisplay(exhibition.status)}
                          </Badge>
                          <Select
                            value={exhibition.status}
                            onValueChange={(value) => handleStatusChange(exhibition.id, value as Exhibition['status'])}
                            disabled={updatingStatus === exhibition.id}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              {updatingStatus === exhibition.id ? (
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Change status" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Pending for Approval</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/manager/exhibitions/${exhibition.id}`)}
                            title="View Exhibition"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/manager/exhibitions/${exhibition.id}/edit`)}
                            title="Edit Exhibition"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <AlertDialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {statusUpdateData && (
                <>
                  Are you sure you want to change the status of <strong>{statusUpdateData.currentTitle}</strong> to <strong>{getStatusDisplay(statusUpdateData.newStatus)}</strong>?
                  {statusUpdateData.newStatus === 'cancelled' && (
                    <p className="mt-2 text-red-500">This will mark the exhibition as cancelled and notify the organizer.</p>
                  )}
                  {statusUpdateData.newStatus === 'completed' && (
                    <p className="mt-2">This will mark the exhibition as completed and notify the organizer.</p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exhibition
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExhibitionsPage; 