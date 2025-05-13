import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VenueType {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

const VenueTypesPage = () => {
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVenueType, setNewVenueType] = useState({ name: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVenueTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch venue types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenueType = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_types')
        .insert([
          {
            name: newVenueType.name,
            description: newVenueType.description,
          },
        ])
        .select();

      if (error) throw error;

      setVenueTypes([...(data as VenueType[]), ...venueTypes]);
      setNewVenueType({ name: '', description: '' });
      
      toast({
        title: "Venue Type Added",
        description: "The venue type has been successfully added.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add venue type",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVenueType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('venue_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVenueTypes(venueTypes.filter(type => type.id !== id));
      
      toast({
        title: "Venue Type Deleted",
        description: "The venue type has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete venue type",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Venue Types</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Venue Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Venue Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newVenueType.name}
                  onChange={(e) => setNewVenueType({ ...newVenueType, name: e.target.value })}
                  placeholder="Enter venue type name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newVenueType.description}
                  onChange={(e) => setNewVenueType({ ...newVenueType, description: e.target.value })}
                  placeholder="Enter venue type description"
                />
              </div>
            </div>
            <Button onClick={handleAddVenueType} className="w-full">
              Add Venue Type
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <TableCell>{venueType.name}</TableCell>
                  <TableCell>{venueType.description}</TableCell>
                  <TableCell>{new Date(venueType.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteVenueType(venueType.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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