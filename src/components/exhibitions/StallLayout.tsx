import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentOperations } from '@/hooks/usePaymentOperations';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import PaymentDialog from './PaymentDialog';
import { supabase } from '@/integrations/supabase/client';
import { StallInstance, StallApplication } from '@/types/exhibition-management';

interface StallLayoutProps {
  stallInstances: StallInstance[];
  onStallSelect?: (instance: StallInstance) => void;
  selectedInstanceId?: string;
  isEditable?: boolean;
  userRole?: 'organiser' | 'brand';
  onUpdatePrice?: (instanceId: string, newPrice: number) => Promise<void>;
  onUpdateStatus?: (instanceId: string, newStatus: string) => Promise<void>;
  onDeleteStall?: (instanceId: string) => Promise<void>;
  onApplyForStall?: (instanceId: string) => Promise<void>;
  onCreatePayment?: (applicationId: string, data: { amount: number; payment_method: string; reference_number?: string }) => Promise<void>;
}

export const StallLayout: React.FC<StallLayoutProps> = ({
  stallInstances = [],
  onStallSelect,
  selectedInstanceId,
  isEditable = false,
  userRole = 'brand',
  onUpdatePrice,
  onUpdateStatus,
  onDeleteStall,
  onApplyForStall,
  onCreatePayment
}) => {
  const { toast } = useToast();
  const [editingPrice, setEditingPrice] = useState<{ id: string; price: string } | null>(null);
  const [selectedStall, setSelectedStall] = useState<StallInstance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const payment = usePaymentOperations(selectedStall?.application?.id ?? '');
  const paymentTransactions = payment?.paymentTransactions?.data ?? [];

  useEffect(() => {
    if (selectedInstanceId) {
      const instance = stallInstances.find(s => s.id === selectedInstanceId);
      if (instance) {
        setSelectedStall(instance);
      }
    } else {
      setSelectedStall(null);
    }
  }, [selectedInstanceId, stallInstances]);

  if (!stallInstances || stallInstances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No stall layout available. Please generate the layout first.
      </div>
    );
  }

  const getStallStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'booked':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStallCursor = (instance: StallInstance) => {
    if (!onStallSelect) return 'cursor-default';
    if (isEditable) return 'cursor-pointer';
    if (userRole === 'brand') {
      // Only allow clicking if the stall is available
      return instance.status === 'available' ? 'cursor-pointer' : 'cursor-not-allowed';
    }
    return 'cursor-not-allowed';
  };

  const handleStallClick = (instance: StallInstance) => {
    if (!onStallSelect) return;
    
    if (isEditable) {
      onStallSelect(instance);
    } else if (userRole === 'brand') {
      if (instance.status === 'available') {
        onStallSelect(instance);
      } else if (instance.status === 'pending') {
        toast({
          title: "Stall Unavailable",
          description: "This stall already has a pending application.",
          variant: "default"
        });
      } else if (instance.status === 'booked') {
        toast({
          title: "Stall Unavailable",
          description: "This stall has already been booked.",
          variant: "default"
        });
      }
    }
  };

  const handlePriceUpdate = async (instanceId: string) => {
    if (!editingPrice || !onUpdatePrice) return;
    
    const newPrice = parseFloat(editingPrice.price);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price greater than 0',
        variant: 'destructive'
      });
      return;
    }

    try {
      await onUpdatePrice(instanceId, newPrice);
      setEditingPrice(null);
      if (selectedStall) {
        setSelectedStall({
          ...selectedStall,
          price: newPrice
        });
      }
      toast({
        title: 'Price updated',
        description: 'The stall price has been updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update price',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async (instanceId: string, newStatus: string) => {
    console.log('StallLayout: Updating status:', { instanceId, newStatus, currentStatus: selectedStall?.status });
    if (!onUpdateStatus) return;

    try {
      await onUpdateStatus(instanceId, newStatus);
      
      // If the stall is being marked as booked, update the application status
      if (newStatus === 'booked' && selectedStall?.application?.id) {
        const { error: applicationError } = await supabase
          .from('stall_applications')
          .update({
            status: 'booked',
            payment_status: 'completed',
            payment_date: new Date().toISOString(),
            booking_confirmed: true
          })
          .eq('id', selectedStall.application.id);

        if (applicationError) {
          console.error('Error updating application:', applicationError);
          throw applicationError;
        }
      }
      
      // Update local state immediately
      if (selectedStall && selectedStall.id === instanceId) {
        setSelectedStall(prev => {
          if (!prev) return null;
          
          let updatedApplication = prev.application;
          if (updatedApplication && newStatus === 'booked') {
            updatedApplication = {
              ...updatedApplication,
              status: 'booked',
              // Only add these properties if application is a full application type
              ...(('payment_status' in updatedApplication) ? { payment_status: 'completed' } : {}),
              ...(('booking_confirmed' in updatedApplication) ? { booking_confirmed: true } : {})
            };
          }
          
          return { 
            ...prev, 
            status: newStatus,
            application: updatedApplication
          };
        });
      }
      
      toast({
        title: 'Status updated',
        description: 'Stall status has been updated successfully.'
      });
    } catch (error) {
      console.error('StallLayout: Error updating status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (instanceId: string) => {
    if (!onDeleteStall) return;

    try {
      await onDeleteStall(instanceId);
      setSelectedStall(null);
      toast({
        title: 'Stall deleted',
        description: 'The stall has been deleted successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete stall',
        variant: 'destructive'
      });
    }
  };

  const handleApply = async (instanceId: string) => {
    if (!onApplyForStall) return;

    try {
      await onApplyForStall(instanceId);
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit application',
        variant: 'destructive'
      });
    }
  };

  // Get the unit from the first stall since it's consistent
  const unit = stallInstances[0]?.stall?.unit;

  const getStallSize = (width: number, length: number) => {
    // Find the smallest dimension among all stalls to use as a base
    const smallestDimension = stallInstances.reduce((min, instance) => {
      const stallWidth = instance.stall?.width || 0;
      const stallLength = instance.stall?.length || 0;
      return Math.min(min, stallWidth, stallLength);
    }, Infinity);

    // Calculate size multiplier based on average of width and length
    const averageDimension = (width + length) / 2;
    const sizeMultiplier = averageDimension / smallestDimension;

    // Base size in pixels (for the smallest stall)
    const baseSize = 140; // Reduced base size for more compact layout
    
    // Calculate new size with a smaller max multiplier
    const maxMultiplier = 1.25; // Reduced from 1.5 to 1.25 for more compact sizing
    const cappedMultiplier = Math.min(sizeMultiplier, maxMultiplier);
    
    // Apply a square root scale to make size differences less dramatic
    const scaledMultiplier = Math.sqrt(cappedMultiplier);
    
    return Math.round(baseSize * scaledMultiplier);
  };

  const renderStallDetails = () => {
    if (!selectedStall) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Selected Stall Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {selectedStall.application && (
                <TabsTrigger value="payments">Payments</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID</Label>
                  <div className="font-medium">{selectedStall.id.split('-')[0]}</div>
                </div>
                <div>
                  <Label>Stall Number</Label>
                  <div className="font-medium">
                    {stallInstances.findIndex(instance => instance.id === selectedStall.id) + 1}
                  </div>
                </div>
                <div>
                  <Label>Stall Name</Label>
                  <div className="font-medium">{selectedStall.stall.name}</div>
                </div>
                <div>
                  <Label>Dimensions</Label>
                  <div className="font-medium">
                    {selectedStall.stall.width} × {selectedStall.stall.length} {selectedStall.stall?.unit?.symbol}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  {userRole === 'organiser' ? (
                    <Select
                      value={selectedStall.status}
                      onValueChange={(value) => handleStatusUpdate(selectedStall.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="font-medium capitalize">{selectedStall.status.replace('_', ' ')}</div>
                  )}
                </div>
                <div>
                  <Label>Price</Label>
                  {userRole === 'organiser' && editingPrice?.id === selectedStall.id ? (
                    <div className="flex gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
                        <Input
                          type="number"
                          value={editingPrice.price}
                          onChange={(e) => setEditingPrice({ id: selectedStall.id, price: e.target.value })}
                          className="pl-6 w-32"
                        />
                      </div>
                      <Button size="sm" onClick={() => handlePriceUpdate(selectedStall.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingPrice(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        ₹{selectedStall.price?.toLocaleString() ?? selectedStall.stall.price.toLocaleString()}
                      </div>
                      {userRole === 'organiser' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingPrice({
                            id: selectedStall.id,
                            price: (selectedStall.price ?? selectedStall.stall.price).toString()
                          })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {userRole === 'organiser' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedStall.id)}
                    disabled={selectedStall.status !== 'available'}
                  >
                    Delete Stall
                  </Button>
                )}
                {userRole === 'brand' && selectedStall.status === 'available' && onApplyForStall && (
                  <Button onClick={() => handleApply(selectedStall.id)}>
                    Apply for Stall
                  </Button>
                )}
              </div>
            </TabsContent>

            {selectedStall.application && (
              <TabsContent value="payments">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Payment History</h3>
                    {userRole === 'organiser' && <PaymentDialog />}
                  </div>

                  {paymentTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {paymentTransactions.map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  ${transaction.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.payment_method}
                                </div>
                                {transaction.reference_number && (
                                  <div className="text-sm text-muted-foreground">
                                    Ref: {transaction.reference_number}
                                  </div>
                                )}
                                <div className="text-sm text-muted-foreground mt-1">
                                  {format(new Date(transaction.transaction_date), 'PPP')}
                                </div>
                              </div>
                              <Badge
                                className={cn(
                                  transaction.status === 'completed' && 'bg-green-100 text-green-800',
                                  transaction.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                                  transaction.status === 'failed' && 'bg-red-100 text-red-800',
                                  transaction.status === 'refunded' && 'bg-gray-100 text-gray-800'
                                )}
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment records found
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="w-full overflow-x-auto bg-white rounded-lg p-4 border">
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          {/* Status Legend and Unit Info */}
          <div className="flex flex-col items-center space-y-2 mb-4 pb-4 border-b">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded-sm" />
                <span className="text-xs text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded-sm" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded-sm" />
                <span className="text-xs text-muted-foreground">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-sm" />
                <span className="text-xs text-muted-foreground">Under Maintenance</span>
              </div>
            </div>
            {unit && (
              <div className="text-xs text-muted-foreground">
                All dimensions in {unit.name} ({unit.symbol})
              </div>
            )}
          </div>

          {/* Layout Grid */}
          <div className="grid gap-8" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            justifyItems: 'center',
            alignItems: 'start'
          }}>
            {stallInstances.map((instance, index) => {
              const dimensions = `${instance.stall?.width} × ${instance.stall?.length} ${instance.stall?.unit?.symbol}`;
              const stallNumber = index + 1;
              const stallSize = getStallSize(instance.stall?.width || 0, instance.stall?.length || 0);
              
              return (
                <div
                  key={instance.id}
                  className={cn(
                    'border rounded-lg transition-all duration-200 shadow-sm hover:shadow-md',
                    getStallStatusColor(instance.status),
                    getStallCursor(instance),
                    selectedInstanceId === instance.id && 'ring-2 ring-primary ring-offset-2'
                  )}
                  style={{
                    transform: instance.rotation_angle ? `rotate(${instance.rotation_angle}deg)` : 'none',
                    position: 'relative',
                    width: `${stallSize}px`,
                    height: `${stallSize}px`,
                    margin: '0 auto'
                  }}
                  onClick={() => handleStallClick(instance)}
                >
                  <div className="p-4 flex flex-col gap-2 h-full">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        Stall {stallNumber}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="text-xs whitespace-nowrap"
                      >
                        {dimensions}
                      </Badge>
                    </div>
                    <div 
                      className="text-xs text-muted-foreground truncate text-center" 
                      title={instance.stall?.name}
                    >
                      {instance.stall?.name}
                    </div>
                    <div className="text-sm font-semibold text-primary mt-auto text-center">
                      ₹{instance.price?.toLocaleString() ?? instance.stall?.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {renderStallDetails()}
    </div>
  );
};
