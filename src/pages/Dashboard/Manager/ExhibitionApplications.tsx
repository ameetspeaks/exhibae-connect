import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStallApplications } from '@/hooks/useStallApplications';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ApplicationStatus, StallApplication } from '@/types/stall-applications';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define valid status transitions
const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  pending: ['payment_pending', 'rejected'],
  payment_pending: ['payment_review', 'rejected'],
  payment_review: ['booked', 'rejected'],
  booked: ['rejected'],
  rejected: ['pending']
};

interface ApplicationDetailsDialogProps {
  application: StallApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
}

const ApplicationDetailsDialog: React.FC<ApplicationDetailsDialogProps> = ({
  application,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  if (!application) return null;

  const allowedTransitions = STATUS_TRANSITIONS[application.status] || [];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            View and manage application details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Brand Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Company:</span> {application.brand?.company_name}</p>
                <p><span className="text-muted-foreground">Contact:</span> {application.brand?.full_name}</p>
                <p><span className="text-muted-foreground">Email:</span> {application.brand?.email}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Stall Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {application.stall?.name}</p>
                <p><span className="text-muted-foreground">Size:</span> {application.stall?.length}×{application.stall?.width}</p>
                <p><span className="text-muted-foreground">Price:</span> ₹{application.stall?.price}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Application Status</h3>
            <div className="flex gap-2">
              {allowedTransitions.map((status) => (
                <Button
                  key={status}
                  variant={status === 'rejected' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => onStatusChange(application.id, status)}
                >
                  {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Timeline</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Applied:</span> {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</p>
              <p><span className="text-muted-foreground">Last Updated:</span> {formatDistanceToNow(new Date(application.updated_at), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ExhibitionApplications = () => {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<StallApplication | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { applications, isLoading, error, updateApplicationStatus } = useStallApplications({
    exhibitionId,
    status: 'all'
  });

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      toast({
        title: "Status Updated",
        description: `Application status has been updated to ${newStatus.replace('_', ' ')}`,
      });
      setIsDetailsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'payment_pending':
      case 'payment_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Error</h2>
        </div>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Exhibition Applications</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No applications found for this exhibition.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Stall</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="font-medium">
                      {application.brand?.company_name || application.brand?.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{application.stall?.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {application.stall?.length}×{application.stall?.width}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{application.brand?.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(application.status)}
                    >
                      {application.status.replace('_', ' ').charAt(0).toUpperCase() + 
                       application.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(application);
                        setIsDetailsDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ApplicationDetailsDialog
        application={selectedApplication}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedApplication(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default ExhibitionApplications; 