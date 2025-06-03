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
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables']
type MeasurementUnit = Tables['measurement_units']['Row'];
type MeasurementUnitInsert = Tables['measurement_units']['Insert'];
type UnitType = MeasurementUnit['type'];

const UNIT_TYPES: UnitType[] = ['length', 'area', 'volume', 'weight', 'temperature', 'other'];

const MeasurementUnitsPage = () => {
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUnit, setNewUnit] = useState<MeasurementUnitInsert>({
    name: '',
    symbol: '',
    type: 'length',
    description: null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMeasurementUnits();
  }, []);

  const seedDefaultUnits = async () => {
    const defaultUnits = [
      {
        name: 'Meter',
        symbol: 'm',
        type: 'length' as const,
        description: 'Standard unit of length'
      },
      {
        name: 'Centimeter',
        symbol: 'cm',
        type: 'length' as const,
        description: '1/100 of a meter'
      },
      {
        name: 'Square Meter',
        symbol: 'm²',
        type: 'area' as const,
        description: 'Standard unit of area'
      },
      {
        name: 'Square Feet',
        symbol: 'ft²',
        type: 'area' as const,
        description: 'Imperial unit of area'
      }
    ] as const;

    try {
      const { data, error } = await supabase
        .from('measurement_units')
        .insert(defaultUnits)
        .select();

      if (error) throw error;

      if (data) {
        setMeasurementUnits(data as MeasurementUnit[]);
        toast({
          title: "Default Units Added",
          description: "Default measurement units have been added successfully.",
        });
      }
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
        .select()
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMeasurementUnits(data as MeasurementUnit[] || []);
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
    if (!newUnit.name || !newUnit.symbol || !newUnit.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('measurement_units')
        .insert([newUnit])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMeasurementUnits([data as MeasurementUnit, ...measurementUnits]);
        setNewUnit({ name: '', symbol: '', type: 'length', description: null });
        setIsAddDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Measurement unit added successfully",
        });
      }
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
        .match({ id });

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
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={newUnit.symbol}
                onChange={(e) => setNewUnit(prev => ({ ...prev, symbol: e.target.value }))}
                placeholder="e.g., m²"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={newUnit.type}
                onValueChange={(value: UnitType) => setNewUnit(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newUnit.description || ''}
                onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value || null }))}
                placeholder="e.g., Standard unit of area measurement"
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
                <TableHead>Symbol</TableHead>
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
                  <TableCell>{unit.symbol}</TableCell>
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