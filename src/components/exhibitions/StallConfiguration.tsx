import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Grid } from 'lucide-react';
import { StallFormData, Stall, Amenity, MeasuringUnit } from '@/types/exhibition-management';
import StallForm from './StallForm';
import StallList from './StallList';
import { StallLayout } from './StallLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';

type StallStatus = 'available' | 'pending' | 'reserved' | 'booked' | 'under_maintenance';

interface StallConfigurationProps {
  stalls: Stall[];
  stallInstances: any[];
  amenities: Amenity[];
  measuringUnits: MeasuringUnit[];
  onAddStall: (data: StallFormData) => Promise<void>;
  onEditStall: (id: string, data: StallFormData) => Promise<void>;
  onDeleteStall: (id: string) => Promise<void>;
  onGenerateLayout?: () => Promise<void>;
  onUpdatePrice?: (instanceId: string, newPrice: number) => Promise<void>;
  onUpdateStatus?: (instanceId: string, newStatus: StallStatus) => Promise<void>;
  isLoading?: boolean;
  exhibitionMeasuringUnitId?: string;
}

const StallConfiguration: React.FC<StallConfigurationProps> = ({
  stalls,
  stallInstances,
  amenities,
  measuringUnits,
  onAddStall,
  onEditStall,
  onDeleteStall,
  onGenerateLayout,
  onUpdatePrice,
  onUpdateStatus,
  isLoading,
  exhibitionMeasuringUnitId
}) => {
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Effect to set the unit ID from either exhibition or existing stalls
  useEffect(() => {
    if (exhibitionMeasuringUnitId) {
      setSelectedUnitId(exhibitionMeasuringUnitId);
    } else if (stalls.length > 0 && stalls[0].unit_id) {
      // If no exhibition unit is set but we have stalls, use the first stall's unit
      setSelectedUnitId(stalls[0].unit_id);
    }
  }, [exhibitionMeasuringUnitId, stalls]);

  const handleStallSubmit = async (data: StallFormData) => {
    try {
      if (!selectedUnitId && data.unit_id) {
        setSelectedUnitId(data.unit_id);
      }
      
      if (editingStall) {
        await onEditStall(editingStall.id, data);
        setEditingStall(null);
      } else {
        await onAddStall(data);
      }
    } catch (error) {
      console.error('Error submitting stall:', error);
    }
  };

  const handleEdit = (stall: Stall) => {
    setEditingStall(stall);
    // Scroll to form
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddMore = () => {
    setEditingStall(null);
    // Scroll to form
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStallSelect = (instance: any) => {
    setSelectedInstanceId(instance.id);
  };

  // Get the measuring unit name and symbol for display
  const selectedUnit = measuringUnits.find(unit => unit.id === selectedUnitId);

  return (
    <div className="space-y-8">
      <div ref={formRef}>
        {selectedUnit && (
          <div className="mb-4 text-sm text-muted-foreground">
            All dimensions will be in {selectedUnit.name} ({selectedUnit.symbol})
          </div>
        )}
        <StallForm
          onSubmit={handleStallSubmit}
          initialData={editingStall}
          amenities={amenities}
          measuringUnits={measuringUnits}
          isLoading={isLoading}
          lockedUnitId={selectedUnitId}
          existingStalls={stalls}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">All Stalls</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleAddMore}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add More Stall
            </Button>
          </div>
        </div>

        <StallList
          stalls={stalls}
          onEdit={handleEdit}
          onDelete={onDeleteStall}
          isLoading={isLoading}
        />
      </div>

      {stalls.length > 0 && onGenerateLayout && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Layout Generation</h3>
            <Button
              onClick={onGenerateLayout}
              variant="default"
              size="default"
              disabled={isLoading}
              className="w-[200px]"
            >
              <Grid className="h-4 w-4 mr-2" />
              Generate Layout
            </Button>
          </div>
        </div>
      )}

      {stallInstances && stallInstances.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Layout Preview</h3>
          <div className="border rounded-lg p-4">
            <StallLayout
              stallInstances={stallInstances}
              selectedInstanceId={selectedInstanceId}
              onStallSelect={handleStallSelect}
              isEditable={true}
              userRole="organiser"
              onUpdatePrice={onUpdatePrice}
              onUpdateStatus={onUpdateStatus}
              onDeleteStall={onDeleteStall}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StallConfiguration; 