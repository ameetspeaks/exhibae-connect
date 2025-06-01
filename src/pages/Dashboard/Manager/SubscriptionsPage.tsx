import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Download, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_active: boolean;
  user_id: string | null;
}

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Subscription[];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const filteredSubscriptions = subscriptions?.filter(sub => 
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportCSV = () => {
    if (!filteredSubscriptions?.length) return;

    const headers = ['Email', 'Name', 'Subscribed Date', 'Status'];
    const csvData = filteredSubscriptions.map(sub => [
      sub.email,
      sub.name || '',
      format(new Date(sub.created_at), 'yyyy-MM-dd HH:mm:ss'),
      sub.is_active ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscriptions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDelete = async () => {
    if (!subscriptionToDelete) return;

    try {
      // First verify if the subscription still exists
      const { data: existingSubscription, error: checkError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('id', subscriptionToDelete.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingSubscription) {
        toast({
          title: 'Error',
          description: 'Subscription not found. It may have been already deleted.',
          variant: 'destructive',
        });
        return;
      }

      // Perform the delete operation
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionToDelete.id);

      if (deleteError) throw deleteError;

      // Double-check if the deletion was successful
      const { data: checkDeleted, error: verifyError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('id', subscriptionToDelete.id)
        .single();

      if (verifyError && verifyError.code !== 'PGRST116') {
        throw verifyError;
      }

      if (checkDeleted) {
        throw new Error('Failed to delete subscription. Please try again.');
      }

      toast({
        title: 'Success',
        description: 'Subscription deleted successfully',
      });

      // Force refresh the data
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      
      // Optionally, you can also force a refetch
      const { data: updatedData, error: refetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!refetchError && updatedData) {
        queryClient.setQueryData(['subscriptions'], updatedData);
      }

    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete subscription',
        variant: 'destructive',
      });
    } finally {
      setSubscriptionToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Newsletter Subscriptions</h1>
        <Button onClick={handleExportCSV} disabled={!filteredSubscriptions?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subscribed Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions?.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.email}</TableCell>
                  <TableCell>{subscription.name || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(subscription.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      subscription.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {subscription.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-red-100 hover:text-red-600"
                          onClick={() => setSubscriptionToDelete(subscription)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the subscription for {subscription.email}?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setSubscriptionToDelete(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSubscriptions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 