import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useApplications } from '@/hooks/useApplicationsData';
import { StallApplication } from '@/types/exhibition-management';
import { formatDate } from '@/lib/utils';

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function Applications() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const { toast } = useToast();
  const {
    applications: { data: applications, isLoading },
    updateApplication,
    deleteApplication,
  } = useApplications(exhibitionId);

  const handleStatusUpdate = async (id: string, status: StallApplication['status']) => {
    try {
      await updateApplication.mutateAsync({ id, status });
      toast({
        title: 'Success',
        description: `Application ${status} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Application deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete application',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
        <CardDescription>
          Manage stall applications for your exhibition
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Stall</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{application.brand?.name}</div>
                    <div className="text-sm text-gray-500">
                      {application.brand?.company}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{application.stall?.name}</div>
                    <div className="text-sm text-gray-500">
                      {application.stall?.length}x{application.stall?.width}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{application.brand?.email}</div>
                    <div className="text-sm text-gray-500">
                      {application.brand?.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      statusColors[application.status as keyof typeof statusColors]
                    }`}
                  >
                    {application.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(application.created_at).relative}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {application.status === 'pending' && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(application.id, 'approved')
                            }
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(application.id, 'rejected')
                            }
                          >
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(application.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 