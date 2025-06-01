import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailLog } from '@/types/email-logs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function EmailLogs() {
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['emailLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailLog[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Email Logs</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedLog(log)}
              >
                <TableCell className="font-medium">{log.email_type}</TableCell>
                <TableCell>{log.recipient_email}</TableCell>
                <TableCell>{log.subject}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.sent_at
                    ? format(new Date(log.sent_at), 'MMM d, yyyy HH:mm:ss')
                    : '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Type</h3>
                <p>{selectedLog.email_type}</p>
              </div>
              <div>
                <h3 className="font-semibold">Recipient</h3>
                <p>{selectedLog.recipient_email}</p>
                {selectedLog.recipient_name && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.recipient_name}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Subject</h3>
                <p>{selectedLog.subject}</p>
              </div>
              <div>
                <h3 className="font-semibold">Content</h3>
                <pre className="mt-2 rounded bg-muted p-4">
                  {JSON.stringify(selectedLog.content, null, 2)}
                </pre>
              </div>
              {selectedLog.error_message && (
                <div>
                  <h3 className="font-semibold text-red-500">Error</h3>
                  <p className="text-red-500">{selectedLog.error_message}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Created At</h3>
                  <p>
                    {format(
                      new Date(selectedLog.created_at),
                      'MMM d, yyyy HH:mm:ss'
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Sent At</h3>
                  <p>
                    {selectedLog.sent_at
                      ? format(
                          new Date(selectedLog.sent_at),
                          'MMM d, yyyy HH:mm:ss'
                        )
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 