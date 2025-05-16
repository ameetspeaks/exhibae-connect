import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StallLayout } from '@/components/exhibitions/StallLayout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useStallData } from '@/hooks/useStallData';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Stall } from '@/types/exhibition-management';

const StallSelectionPage: React.FC = () => {
  const { exhibitionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');

  const { stalls, isLoading, error, submitApplication } = useStallData(exhibitionId!);

  const handleStallSelect = (stall: Stall) => {
    if (stall.status === 'available') {
      setSelectedStall(stall);
    }
  };

  const handleApply = async () => {
    if (!selectedStall || !user) return;

    try {
      // Get the user's profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');

      await submitApplication.mutateAsync({
        stall_id: selectedStall.id,
        brand_id: profileData.id,
        exhibition_id: exhibitionId!,
        status: 'pending',
        message: applicationMessage,
        requirements: [],
        payment_status: 'pending',
        booking_confirmed: false
      });

      toast({
        title: "Application Submitted",
        description: `Your application for Stall ${selectedStall.name} has been submitted successfully.`,
      });
      
      setIsConfirmDialogOpen(false);
      setApplicationMessage('');
      setSelectedStall(null);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-medium text-red-600">Failed to load stalls</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Select a Stall</CardTitle>
          <CardDescription>
            Click on an available stall to view details and apply. Yellow stalls have pending applications, and red stalls are already booked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StallLayout
            stallInstances={stalls?.map(stall => ({
              id: stall.id,
              stall_id: stall.id,
              exhibition_id: stall.exhibition_id,
              instance_number: 1,
              position_x: 0,
              position_y: 0,
              rotation_angle: 0,
              status: stall.status,
              price: stall.price,
              created_at: '',
              updated_at: '',
              stall: stall
            })) || []}
            onStallSelect={(instance) => handleStallSelect(instance.stall)}
            selectedInstanceId={selectedStall?.id}
            isEditable={false}
            userRole="brand"
          />

          {selectedStall && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Selected Stall Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Stall Name:</span>
                <span>{selectedStall.name}</span>
                <span className="text-gray-600">Size:</span>
                <span>{selectedStall.width}m × {selectedStall.length}m</span>
                <span className="text-gray-600">Price:</span>
                <span>₹{selectedStall.price}</span>
                {selectedStall.description && (
                  <>
                    <span className="text-gray-600">Description:</span>
                    <span>{selectedStall.description}</span>
                  </>
                )}
              </div>

              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full">Apply for This Stall</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply for {selectedStall.name}</DialogTitle>
                    <DialogDescription>
                      Please provide some information about your brand and why you'd like to participate in this exhibition.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="message">Application Message</Label>
                      <Textarea
                        id="message"
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        placeholder="Tell us about your brand and why you'd like to participate..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleApply}
                      disabled={submitApplication.isPending || !applicationMessage.trim()}
                    >
                      {submitApplication.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Confirm Application'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StallSelectionPage; 