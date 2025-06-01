import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VenueType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const VenueTypesPage = () => {
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueTypeToDelete, setVenueTypeToDelete] = useState<VenueType | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('venue_types')
        .select('id, name, description, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVenueTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching venue types:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch venue types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenueType = async () => {
    if (!venueTypeToDelete) return;

    try {
      const { error } = await supabase
        .from('venue_types')
        .delete()
        .eq('id', venueTypeToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venue type deleted successfully",
      });
      
      // Reset the venue type to delete
      setVenueTypeToDelete(null);
      
      // Refresh the list
      fetchVenueTypes();
    } catch (error: any) {
      console.error('Error deleting venue type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete venue type",
        variant: "destructive",
      });
      // Reset the venue type to delete on error
      setVenueTypeToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Venue Types</h1>
        <Button onClick={() => navigate('/dashboard/manager/venue-types/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Venue Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Venue Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venueTypes.map((venueType) => (
                <TableRow key={venueType.id}>
                  <TableCell className="font-medium">{venueType.name}</TableCell>
                  <TableCell>{venueType.description || '-'}</TableCell>
                  <TableCell>{new Date(venueType.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setVenueTypeToDelete(venueType)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the venue type "{venueType.name}". 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setVenueTypeToDelete(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteVenueType}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {venueTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No venue types found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueTypesPage; 