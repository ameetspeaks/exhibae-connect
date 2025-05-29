import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSubscriptions } from '@/hooks/useSubscription';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SubscriptionList() {
  const { data: subscriptions, isLoading } = useSubscriptions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscriptions?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No subscriptions found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscribed At</TableHead>
            <TableHead>User ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {subscription.email}
              </TableCell>
              <TableCell>{subscription.name || '-'}</TableCell>
              <TableCell>
                {subscription.is_active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                {new Date(subscription.subscribed_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {subscription.user_id || 'Guest'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 