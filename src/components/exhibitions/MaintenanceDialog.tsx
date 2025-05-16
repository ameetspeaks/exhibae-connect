import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface MaintenanceDialogProps {
  onScheduleMaintenance?: (data: {
    maintenance_type: string;
    description?: string;
    next_maintenance_date?: string;
  }) => Promise<void>;
}

const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({ onScheduleMaintenance }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState('');
  const [description, setDescription] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState<Date>();

  const handleSubmit = async () => {
    if (!maintenanceType || !maintenanceDate) {
      return;
    }

    try {
      await onScheduleMaintenance?.({
        maintenance_type: maintenanceType,
        description,
        next_maintenance_date: maintenanceDate.toISOString(),
      });
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    }
  };

  const resetForm = () => {
    setMaintenanceType('');
    setDescription('');
    setMaintenanceDate(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Schedule Maintenance</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Maintenance Type</Label>
            <Select value={maintenanceType} onValueChange={setMaintenanceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter maintenance details"
            />
          </div>
          <div className="grid gap-2">
            <Label>Maintenance Date</Label>
            <Calendar
              mode="single"
              selected={maintenanceDate}
              onSelect={setMaintenanceDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!maintenanceType || !maintenanceDate}>
            Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceDialog; 