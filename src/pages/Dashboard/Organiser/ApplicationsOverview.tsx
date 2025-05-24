import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Loader2, 
  Search, 
  CheckCircle2, 
  XCircle,
  Clock,
  Filter,
  Trash,
  AlertCircle,
  CheckCircle,
  Store
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useApplications } from '@/hooks/useApplicationsData';
import { ApplicationStatus, StallApplication } from '@/types/stall-applications';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentReviewForm } from '@/components/exhibitions/PaymentReviewForm';
import type { StallApplication as StallApplicationType } from '@/types/stall-applications';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  payment_pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  payment_review: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  booked: 'bg-green-100 text-green-800 hover:bg-green-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  payment_pending: <Clock className="h-4 w-4" />,
  payment_review: <Clock className="h-4 w-4" />,
  booked: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

export default function ApplicationsOverview() {  
  const [searchTerm, setSearchTerm] = useState('');  
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');  
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);  
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);  
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | null>(null);  
  const [selectedApplication, setSelectedApplication] = useState<StallApplication | null>(null);  
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);  
  const [isPaymentReviewOpen, setIsPaymentReviewOpen] = useState(false);  
  const [isUpdating, setIsUpdating] = useState(false);  
  const { toast } = useToast();
  const {
    applications: { data: applications = [], isLoading },
    updateApplication,
    deleteApplication,
  } = useApplications() as unknown as {
    applications: { data: StallApplicationType[], isLoading: boolean },
    updateApplication: {
      mutateAsync: (data: { id: string; status: ApplicationStatus }) => Promise<any>;
    },
    deleteApplication: {
      mutateAsync: (id: string) => Promise<void>;
    }
  };
  const navigate = useNavigate();

  const handleStatusUpdate = async (id: string, status: ApplicationStatus) => {
    console.log('Attempting to update status:', { id, status });
    if (!id || !status) {
      console.error('Invalid parameters for status update:', { id, status });
      toast({
        title: 'Error',
        description: 'Invalid parameters for status update',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      console.log('Calling updateApplication.mutateAsync');
      const result = await updateApplication.mutateAsync({ id, status });
      console.log('Status update successful, result:', result);
      
      toast({
        title: 'Success',
        description: `Application ${status.replace('_', ' ')} successfully`,
      });
      
      // Close both dialogs
      setIsPaymentReviewOpen(false);
      setIsDetailViewOpen(false);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
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

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedApplications.map(id => deleteApplication.mutateAsync(id)));
      } else {
        await Promise.all(
          selectedApplications.map(id => 
            updateApplication.mutateAsync({ 
              id, 
              status: bulkAction === 'approve' ? 'booked' : 'rejected' 
            })
          )
        );
      }

      toast({
        title: 'Success',
        description: `Successfully ${bulkAction}ed ${selectedApplications.length} applications`,
      });

      setSelectedApplications([]);
      setBulkAction(null);
      setIsBulkActionDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${bulkAction} applications`,
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(filteredApplications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const toggleSelectApplication = (id: string) => {
    setSelectedApplications(prev => 
      prev.includes(id) 
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const filteredApplications = applications.filter(app => {
    // Status filter
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  }).filter(app =>
    searchTerm === '' ||
    app.brand?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.brand?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.stall?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    payment_pending: applications.filter(app => app.status === 'payment_pending').length,
    payment_review: applications.filter(app => app.status === 'payment_review').length,
    booked: applications.filter(app => app.status === 'booked').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  const openDetailView = (application: StallApplication) => {
    setSelectedApplication(application);
    setIsDetailViewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Applications</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                <Filter className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.booked}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, company, or stall..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {selectedApplications.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedApplications.length} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setBulkAction('approve');
                    setIsBulkActionDialogOpen(true);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setBulkAction('reject');
                    setIsBulkActionDialogOpen(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setBulkAction('delete');
                    setIsBulkActionDialogOpen(true);
                  }}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <Tabs value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="payment_review">Payment Review</TabsTrigger>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]">
                  <Checkbox
                    checked={
                      filteredApplications.length > 0 &&
                      selectedApplications.length === filteredApplications.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Exhibition</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Stall</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow 
                  key={application.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetailView(application)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedApplications.includes(application.id)}
                      onCheckedChange={() => toggleSelectApplication(application.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/dashboard/organiser/exhibitions/${application.exhibition_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {application.exhibition?.title || 'View Exhibition'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.brand?.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {application.brand?.company_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.stall?.name}</div>
                      <div className="text-sm text-gray-500">
                        {application.stall?.length}×{application.stall?.width}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{application.brand?.email}</div>
                      <div className="text-sm text-gray-500">
                        {application.brand?.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`flex items-center gap-1 ${
                        statusColors[application.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusIcons[application.status as keyof typeof statusIcons]}
                      <span className="capitalize">{application.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(application.created_at).full}
                      <div className="text-xs text-gray-500">
                        {formatDate(application.created_at).relative}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                    {application.status === 'payment_review' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdating}
                        className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        onClick={(e) => {
                          console.log('Review Payment button clicked', { 
                            applicationId: application.id,
                            paymentSubmission: application.payment_submissions?.[0],
                            applicationStatus: application.status
                          });
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Setting selected application:', application);
                          setSelectedApplication(application);
                          console.log('Opening payment review dialog');
                          setIsPaymentReviewOpen(true);
                        }}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        Review Payment
                      </Button>
                    )}
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
                              onClick={() => handleStatusUpdate(application.id, 'payment_pending')}
                            >
                              Approve for Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            >
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {application.status === 'payment_pending' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(application.id, 'payment_review')}
                          >
                            Mark as Payment Submitted
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => window.open(`/brands/${application.brand_id}`, '_blank')}
                          className="text-primary"
                        >
                          <Store className="h-4 w-4 mr-2" />
                          View Brand Portfolio
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(application.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'delete' ? 'Delete Applications' : `${bulkAction === 'approve' ? 'Approve' : 'Reject'} Applications`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'delete'
                ? `Are you sure you want to delete ${selectedApplications.length} applications? This action cannot be undone.`
                : `Are you sure you want to ${bulkAction} ${selectedApplications.length} applications?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>
              {bulkAction === 'delete' ? 'Delete' : bulkAction === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Application Detail Dialog */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Application Details</DialogTitle>
                <DialogDescription>
                  View and manage application details
                </DialogDescription>
              </div>
              {selectedApplication && selectedApplication.status === 'payment_review' && (
                <Button 
                  onClick={() => setIsPaymentReviewOpen(true)}
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Review Payment
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh]">
            {selectedApplication && (
              <div className="space-y-6">
                {/* Exhibition Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Exhibition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Exhibition Name</p>
                      <p className="font-medium">{selectedApplication.exhibition?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        className={`${
                          statusColors[selectedApplication.status as keyof typeof statusColors]
                        }`}
                      >
                        {selectedApplication.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Payment Details Section - Show when in payment_review status */}
                {selectedApplication.status === 'payment_review' && selectedApplication.payment_submissions?.[0] && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="font-medium">₹{selectedApplication.payment_submissions[0].amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                        <p className="font-medium">{selectedApplication.payment_submissions[0].transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Email</p>
                        <p className="font-medium">{selectedApplication.payment_submissions[0].email}</p>
                      </div>
                      {selectedApplication.payment_submissions[0].notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Payment Notes</p>
                          <p className="mt-1 whitespace-pre-wrap">{selectedApplication.payment_submissions[0].notes}</p>
                        </div>
                      )}
                      {selectedApplication.payment_submissions[0].proof_file_url && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Payment Proof</p>
                          <a
                            href={selectedApplication.payment_submissions[0].proof_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
                          >
                            View Payment Proof
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsPaymentReviewOpen(true)}
                        className="flex items-center gap-2"
                      >
                        Review Payment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Brand Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Brand Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Brand Name</p>
                      <p className="font-medium">{selectedApplication.brand?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{selectedApplication.brand?.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Email</p>
                      <p className="font-medium">{selectedApplication.brand?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{selectedApplication.brand?.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Stall Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Stall Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stall Name</p>
                      <p className="font-medium">{selectedApplication.stall?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium">
                        {selectedApplication.stall?.length}×{selectedApplication.stall?.width}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">₹{selectedApplication.stall?.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Application Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Application Message</p>
                      <p className="mt-1 whitespace-pre-wrap">{selectedApplication.message || 'No message provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Applied On</p>
                      <div>
                        <p className="font-medium">{formatDate(selectedApplication.created_at).full}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedApplication.created_at).relative}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <div>
                        <p className="font-medium">{formatDate(selectedApplication.updated_at).full}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedApplication.updated_at).relative}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment Review Dialog */}
      {selectedApplication?.payment_submissions?.[0] && (
        <Dialog 
          open={isPaymentReviewOpen} 
          onOpenChange={(open) => {
            console.log('Dialog open state changing to:', open, {
              selectedApplication,
              paymentSubmission: selectedApplication.payment_submissions?.[0],
              isPaymentReviewOpen
            });
            if (!open) {
              console.log('Dialog closing, resetting state');
              setIsUpdating(false);
            }
            setIsPaymentReviewOpen(open);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Payment</DialogTitle>
              <DialogDescription>
                Review payment details and take action for application {selectedApplication.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">₹{selectedApplication.payment_submissions[0].amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-medium">{selectedApplication.payment_submissions[0].transaction_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Email</p>
                  <p className="font-medium">{selectedApplication.payment_submissions[0].email}</p>
                </div>
                {selectedApplication.payment_submissions[0].notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Payment Notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{selectedApplication.payment_submissions[0].notes}</p>
                  </div>
                )}
                {selectedApplication.payment_submissions[0].proof_file_url && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Payment Proof</p>
                    <a
                      href={selectedApplication.payment_submissions[0].proof_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
                    >
                      View Payment Proof
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => {
                    console.log('Rejecting payment for application:', selectedApplication.id);
                    handleStatusUpdate(selectedApplication.id, 'rejected');
                  }}
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject Payment'
                  )}
                </Button>
                <Button
                  disabled={isUpdating}
                  onClick={() => {
                    console.log('Approving payment for application:', selectedApplication.id);
                    handleStatusUpdate(selectedApplication.id, 'booked');
                  }}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Approve Payment'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 