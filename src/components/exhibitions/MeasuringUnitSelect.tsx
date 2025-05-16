import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MeasuringUnit } from '@/types/exhibition-management';
import { Loader2 } from 'lucide-react';

interface MeasuringUnitSelectProps {
  measuringUnits: MeasuringUnit[];
  selectedUnitId: string;
  onUnitSelect: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const MeasuringUnitSelect: React.FC<MeasuringUnitSelectProps> = ({
  measuringUnits,
  selectedUnitId,
  onUnitSelect,
  disabled = false,
  isLoading
}) => {
  // Filter to show only length and area units for stall dimensions
  const filteredUnits = measuringUnits.filter(unit => 
    unit.type === 'length' || unit.type === 'area'
  );

  // Find the selected unit for display
  const selectedUnit = measuringUnits.find(unit => unit.id === selectedUnitId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (filteredUnits.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No units available
      </div>
    );
  }

  // If disabled and we have a selected unit, show it as text
  if (disabled && selectedUnit) {
    return (
      <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
        {selectedUnit.name} ({selectedUnit.symbol})
      </div>
    );
  }

  return (
    <Select
      value={selectedUnitId}
      onValueChange={onUnitSelect}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select unit">
          {selectedUnit ? `${selectedUnit.name} (${selectedUnit.symbol})` : 'Select unit'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {filteredUnits.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            {unit.name} ({unit.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MeasuringUnitSelect; 