import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  selectedUnitId?: string;
  onUnitSelect: (unitId: string) => void;
  isLoading?: boolean;
}

const MeasuringUnitSelect: React.FC<MeasuringUnitSelectProps> = ({
  measuringUnits,
  selectedUnitId,
  onUnitSelect,
  isLoading
}) => {
  console.log('MeasuringUnitSelect props:', { measuringUnits, selectedUnitId, isLoading });

  // Filter to show only length and area units for stall dimensions
  const filteredUnits = measuringUnits.filter(unit => 
    unit.type === 'length' || unit.type === 'area'
  );

  console.log('Filtered units:', filteredUnits);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Measuring Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose the measuring unit that will be used for all stalls in this exhibition.
            This cannot be changed once stalls are created.
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading units...</span>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {measuringUnits.length === 0 
                ? "No measuring units available. Please contact the administrator."
                : "No length or area units available. Please contact the administrator."}
            </div>
          ) : (
            <Select
              value={selectedUnitId}
              onValueChange={onUnitSelect}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a measuring unit" />
              </SelectTrigger>
              <SelectContent>
                {filteredUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeasuringUnitSelect; 