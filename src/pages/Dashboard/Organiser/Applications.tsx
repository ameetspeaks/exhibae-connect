import { useParams, Link } from 'react-router-dom';
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
import { MoreHorizontal, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStallApplications } from '@/hooks/useStallApplications';
import { ApplicationStatus } from '@/types/stall-applications';

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
  approved: null,
} as const;

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  approved: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
} as const;

export default function Applications() {
  const { exhibitionId } = useParams<{ exhibitionId?: string }>();
  const { toast } = useToast();
  const {
    applications,
    isLoading,
    error,
    updateApplicationStatus,
    deleteApplication,
    filters,
    setFilters,
  } = useStallApplications({
    exhibitionId,
    status: 'all',
  });

  const handleStatusUpdate = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(id, newStatus);
      toast({
        title: 'Success',
        description: `Application ${newStatus} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await deleteApplication(id);
      toast({
        title: 'Success',
        description: 'Application deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete application',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Applications</h1>
        <p className="text-sm text-muted-foreground">
          Showing {applications.length} applications
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Exhibition</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Stall</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <Link 
                    to={`/dashboard/organiser/exhibitions/${application.exhibition_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {application.exhibition?.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {application.brand?.company_name || application.brand?.full_name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{application.stall?.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {application.stall?.length}×{application.stall?.width}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {application.brand?.email}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusIcons[application.status]}
                    <Badge 
                      variant="outline" 
                      className={statusColors[application.status]}
                    >
                      {application.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {application.status === 'pending' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(application.id, 'approved')}
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          >
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(application.id)}
                        className="text-red-600"
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
      </div>
    </div>
  );
} 