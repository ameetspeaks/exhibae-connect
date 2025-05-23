import React, { useState } from 'react';
import { useStallApplications } from '@/hooks/useStallApplications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationStatus, StallApplication } from '@/types/stall-applications';
import { formatDistanceToNow, format, isAfter, isBefore, parseISO } from 'date-fns';
import { ArrowUpDown, Search, Filter, Check, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type SortField = 'created_at' | 'brand.company_name' | 'stall.name' | 'status';
type SortOrder = 'asc' | 'desc';
type StatusFilter = ApplicationStatus | 'all';

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
                  {status === 'rejected' ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Timeline</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Applied:</span> {format(new Date(application.created_at), 'PPpp')}</p>
              <p><span className="text-muted-foreground">Last Updated:</span> {format(new Date(application.updated_at), 'PPpp')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ITEMS_PER_PAGE = 10;

const ApplicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'created_at',
    order: 'desc',
  });
  const [selectedApplication, setSelectedApplication] = useState<StallApplication | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [selectedExhibition, setSelectedExhibition] = useState<string>('all');
  const { toast } = useToast();
  
  const { applications, isLoading, error, updateApplicationStatus } = useStallApplications({
    status: statusFilter === 'all' ? undefined : statusFilter,
    exhibitionId: selectedExhibition === 'all' ? undefined : selectedExhibition,
  });

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

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortApplications = (apps: StallApplication[]) => {
    return [...apps].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.field) {
        case 'brand.company_name':
          aValue = a.brand?.company_name || '';
          bValue = b.brand?.company_name || '';
          break;
        case 'stall.name':
          aValue = a.stall?.name || '';
          bValue = b.stall?.name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a[sortConfig.field]).getTime();
          bValue = new Date(b[sortConfig.field]).getTime();
      }

      if (sortConfig.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = searchTerm === '' || 
      application.brand?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.brand?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.brand?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.stall?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = (!dateRange.from || isAfter(parseISO(application.created_at), dateRange.from)) &&
      (!dateRange.to || isBefore(parseISO(application.created_at), dateRange.to));

    return matchesSearch && matchesDate;
  });

  const sortedApplications = sortApplications(filteredApplications);
  
  // Pagination
  const totalPages = Math.ceil(sortedApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = sortedApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      // Validate status transition
      const currentStatus = applications.find(app => app.id === applicationId)?.status;
      if (!currentStatus) throw new Error('Application not found');
      
      const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
      if (!allowedTransitions?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

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

  const handleBulkAction = async (action: ApplicationStatus) => {
    try {
      // Validate all transitions before proceeding
      const invalidTransitions = selectedApplications.filter(id => {
        const app = applications.find(a => a.id === id);
        if (!app) return true;
        const allowedTransitions = STATUS_TRANSITIONS[app.status];
        return !allowedTransitions?.includes(action);
      });

      if (invalidTransitions.length > 0) {
        throw new Error(`Some applications cannot transition to ${action} status`);
      }

      await Promise.all(
        selectedApplications.map(id => updateApplicationStatus(id, action))
      );
      toast({
        title: "Bulk Update Successful",
        description: `Updated ${selectedApplications.length} applications to ${action.replace('_', ' ')}`,
      });
      setSelectedApplications([]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update some applications",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedApplications.length === paginatedApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(paginatedApplications.map(app => app.id));
    }
  };

  const toggleSelectApplication = (id: string) => {
    setSelectedApplications(prev =>
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    );
  };

  // Get unique exhibitions for the filter
  const exhibitions = Array.from(new Set(applications.map(app => app.exhibition))).filter(Boolean);

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Applications</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Applications</h2>
          <p className="text-muted-foreground">
            {applications.length} total applications
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="payment_pending">Payment Pending</SelectItem>
              <SelectItem value="payment_review">Payment Review</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedExhibition}
            onValueChange={setSelectedExhibition}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by exhibition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exhibitions</SelectItem>
              {exhibitions.map(exhibition => (
                <SelectItem key={exhibition?.id} value={exhibition?.id || ''}>
                  {exhibition?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[250px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                selected={{
                  from: dateRange.from || undefined,
                  to: dateRange.to || undefined,
                }}
                onSelect={(range) => 
                  setDateRange({ 
                    from: range?.from || null, 
                    to: range?.to || null 
                  })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedApplications.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedApplications.length} applications selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('booked')}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('rejected')}
            >
              <X className="h-4 w-4 mr-1" />
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading applications...</div>
      ) : paginatedApplications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No applications found.
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedApplications.length === paginatedApplications.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('brand.company_name')}>
                      Brand/Company
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('stall.name')}>
                      Exhibition/Stall
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" onClick={() => handleSort('status')}>
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" onClick={() => handleSort('created_at')}>
                      Applied
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="px-2">
                      <Checkbox
                        checked={selectedApplications.includes(application.id)}
                        onCheckedChange={() => toggleSelectApplication(application.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {application.brand?.company_name || application.brand?.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          to={`/dashboard/manager/exhibitions/${application.exhibition_id}`}
                          className="text-blue-600 hover:underline block text-sm"
                        >
                          {application.exhibition?.title || 'View Exhibition'}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {application.stall?.name} ({application.stall?.length}×{application.stall?.width})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("whitespace-nowrap", getStatusColor(application.status))}
                      >
                        {application.status.replace('_', ' ').charAt(0).toUpperCase() + 
                         application.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedApplications.length)} of {sortedApplications.length} applications
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
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

export default ApplicationsPage; 