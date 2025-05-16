import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useApplications } from '@/hooks/useApplicationsData';
import { StallApplication } from '@/types/exhibition-management';
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

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

export default function ApplicationsOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<StallApplication | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const { toast } = useToast();
  const {
    applications: { data: applications = [], isLoading },
    updateApplication,
    deleteApplication,
  } = useApplications();

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
              status: bulkAction === 'approve' ? 'approved' : 'rejected' 
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

  const filteredApplications = applications
    .filter(app => 
      (statusFilter === 'all' || app.status === statusFilter) &&
      (app.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.brand?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.stall?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
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
                <p className="text-2xl font-bold">{stats.approved}</p>
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
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
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
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(application.id, 'rejected')
                              }
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(application.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Detailed information about the application
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Exhibition Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Exhibition Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-medium">{selectedApplication.exhibition?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedApplication.exhibition?.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dates</p>
                      <p className="font-medium">
                        {selectedApplication.exhibition?.start_date && formatDate(selectedApplication.exhibition.start_date).short} - {selectedApplication.exhibition?.end_date && formatDate(selectedApplication.exhibition.end_date).short}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brand Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Brand Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Brand Name</p>
                      <p className="font-medium">{selectedApplication.brand?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{selectedApplication.brand?.company}</p>
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
                  <h3 className="text-lg font-semibold mb-2">Stall Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stall Name/Number</p>
                      <p className="font-medium">{selectedApplication.stall?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{selectedApplication.stall?.length}x{selectedApplication.stall?.width}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">£{selectedApplication.stall?.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={statusColors[selectedApplication.status]}>
                        {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                      </Badge>
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

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  {selectedApplication.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                        className="bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedApplication.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 