import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: 'length' | 'area' | 'volume' | 'weight' | 'temperature' | 'other';
  description: string | null;
  created_at: string;
}

const UNIT_TYPES = ['length', 'area', 'volume', 'weight', 'temperature', 'other'] as const;

const MeasurementUnitsPage = () => {
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    abbreviation: '',
    type: 'length' as const,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMeasurementUnits();
  }, []);

  const seedDefaultUnits = async () => {
    const defaultUnits = [
      {
        name: 'Meter',
        abbreviation: 'm',
        type: 'length',
        description: 'Standard unit of length'
      },
      {
        name: 'Centimeter',
        abbreviation: 'cm',
        type: 'length',
        description: '1/100 of a meter'
      },
      {
        name: 'Square Meter',
        abbreviation: 'm²',
        type: 'area',
        description: 'Standard unit of area'
      },
      {
        name: 'Square Feet',
        abbreviation: 'ft²',
        type: 'area',
        description: 'Imperial unit of area'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('measurement_units')
        .insert(defaultUnits)
        .select();

      if (error) throw error;

      setMeasurementUnits(data);
      toast({
        title: "Default Units Added",
        description: "Default measurement units have been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add default units",
        variant: "destructive",
      });
    }
  };

  const fetchMeasurementUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        // If no units exist, show a button to add default units
        return setMeasurementUnits([]);
      }

      setMeasurementUnits(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch measurement units",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name || !newUnit.abbreviation || !newUnit.type) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('measurement_units')
        .insert([{
          name: newUnit.name,
          abbreviation: newUnit.abbreviation,
          type: newUnit.type
        }])
        .select()
        .single();

      if (error) throw error;

      setMeasurementUnits([...measurementUnits, data]);
      setNewUnit({ name: '', abbreviation: '', type: 'length', description: '' });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Measurement unit added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add measurement unit",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('measurement_units')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMeasurementUnits(measurementUnits.filter(unit => unit.id !== id));
      
      toast({
        title: "Measurement Unit Deleted",
        description: "The measurement unit has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete measurement unit",
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
        <h1 className="text-3xl font-bold">Measurement Units</h1>
        <div className="space-x-4">
          {measurementUnits.length === 0 && (
            <Button onClick={seedDefaultUnits} variant="secondary">
              Add Default Units
            </Button>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Measurement Unit
          </Button>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Measurement Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUnit.name}
                onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Square Meter"
              />
            </div>
            <div>
              <Label htmlFor="abbreviation">Abbreviation</Label>
              <Input
                id="abbreviation"
                value={newUnit.abbreviation}
                onChange={(e) => setNewUnit(prev => ({ ...prev, abbreviation: e.target.value }))}
                placeholder="e.g., m²"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={newUnit.type}
                onChange={(e) => setNewUnit(prev => ({ ...prev, type: e.target.value as typeof prev.type }))}
                placeholder="e.g., area"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUnit}>Add Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Measurement Units</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurementUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell>{unit.abbreviation}</TableCell>
                  <TableCell>{unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}</TableCell>
                  <TableCell>{unit.description}</TableCell>
                  <TableCell>{new Date(unit.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUnit(unit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {measurementUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No measurement units found
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

export default MeasurementUnitsPage; 