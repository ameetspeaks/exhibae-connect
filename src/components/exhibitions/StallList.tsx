import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Loader2 } from 'lucide-react';
import { Stall, MeasuringUnit, Amenity } from '@/types/exhibition-management';
import { useToast } from '@/hooks/use-toast';

interface StallListProps {
  stalls: Stall[];
  onEdit: (stall: Stall) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const StallList: React.FC<StallListProps> = ({ stalls, onEdit, onDelete, isLoading }) => {
  const [stallToDelete, setStallToDelete] = useState<Stall | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!stallToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(stallToDelete.id);
      toast({
        title: 'Success',
        description: 'The stall has been removed successfully.',
      });
      setStallToDelete(null);
    } catch (error) {
      console.error('Error deleting stall:', error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to delete stall. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading stalls...</span>
      </div>
    );
  }

  if (!stalls || stalls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No stalls added yet. Use the configuration form above to add stalls.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Amenities</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stalls.map((stall) => (
            <TableRow key={stall.id}>
              <TableCell className="font-medium">{stall.name}</TableCell>
              <TableCell>
                {stall.length} × {stall.width} {stall.unit?.symbol}
              </TableCell>
              <TableCell>₹{stall.price.toFixed(2)}</TableCell>
              <TableCell>{stall.quantity}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {stall.amenities && stall.amenities.length > 0 ? (
                    stall.amenities.map(amenity => (
                      <Badge key={amenity.id} variant="secondary">{amenity.name}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(stall)}
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStallToDelete(stall)}
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog 
        open={!!stallToDelete} 
        onOpenChange={(open) => !open && !isDeleting && setStallToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stall</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this stall? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStallToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StallList;
