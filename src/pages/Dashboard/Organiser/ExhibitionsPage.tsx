import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import ExhibitionList from '@/components/exhibitions/ExhibitionList';
import { useExhibitions, useDeleteExhibition } from '@/hooks/useExhibitionsData';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';

const ExhibitionsPage = () => {
  const { user } = useAuth();
  const { data: exhibitions, isLoading, error } = useExhibitions(user?.id);
  const deleteMutation = useDeleteExhibition();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return Promise.resolve();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete exhibition',
        variant: 'destructive',
      });
      return Promise.reject(error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        Please log in to view your exhibitions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exhibitions</h2>
        <Button className="bg-exhibae-navy hover:bg-opacity-90" asChild>
          <Link to="/dashboard/organiser/exhibitions/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Exhibition
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search exhibitions..." className="pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading exhibitions...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error instanceof Error ? error.message : 'Failed to load exhibitions'}
        </div>
      ) : (
        <ExhibitionList exhibitions={exhibitions || []} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default ExhibitionsPage;
