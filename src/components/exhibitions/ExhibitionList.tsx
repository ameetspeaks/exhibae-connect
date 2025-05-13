
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Eye, Pencil, Trash, Plus } from 'lucide-react';
import { Exhibition } from '@/types/exhibition-management';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ExhibitionListProps {
  exhibitions: Exhibition[];
  onDelete: (id: string) => Promise<void>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ExhibitionList: React.FC<ExhibitionListProps> = ({ exhibitions, onDelete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exhibitionToDelete, setExhibitionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const confirmDelete = (id: string) => {
    setExhibitionToDelete(id);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!exhibitionToDelete) return;
    
    try {
      await onDelete(exhibitionToDelete);
      toast({
        title: 'Exhibition deleted',
        description: 'The exhibition has been successfully deleted',
      });
      setIsDialogOpen(false);
      setExhibitionToDelete(null);
    } catch (error) {
      toast({
        title: 'Deletion failed',
        description: error instanceof Error ? error.message : 'Failed to delete exhibition',
        variant: 'destructive',
      });
    }
  };

  if (exhibitions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No exhibitions found</h3>
        <p className="text-muted-foreground mb-6">You haven't created any exhibitions yet.</p>
        <Button asChild>
          <Link to="/dashboard/organiser/exhibitions/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Exhibition
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exhibitions.map((exhibition) => (
            <TableRow key={exhibition.id}>
              <TableCell className="font-medium">{exhibition.title}</TableCell>
              <TableCell>{`${exhibition.city}, ${exhibition.state}`}</TableCell>
              <TableCell>
                {exhibition.start_date && format(new Date(exhibition.start_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(exhibition.status)}>
                  {exhibition.status.charAt(0).toUpperCase() + exhibition.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/dashboard/organiser/exhibitions/${exhibition.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/dashboard/organiser/exhibitions/${exhibition.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => confirmDelete(exhibition.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exhibition</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this exhibition? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExhibitionList;
