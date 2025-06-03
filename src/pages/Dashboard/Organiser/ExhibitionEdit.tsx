import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExhibitionForm from '@/components/exhibitions/ExhibitionForm';
import StallConfiguration from '@/components/exhibitions/StallConfiguration';
import GalleryUpload from '@/components/exhibitions/GalleryUpload';
import LayoutUpload from '@/components/exhibitions/LayoutUpload';
import StallList from '@/components/exhibitions/StallList';
import { 
  useExhibition,
  useUpdateExhibition,
  useCategories,
  useVenueTypes,
  useMeasuringUnits,
  useEventTypes
} from '@/hooks/useExhibitionsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useAmenities } from '@/hooks/useAmenitiesData';
import { useToast } from '@/hooks/use-toast';
import { ExhibitionFormData, Stall, StallFormData, StallInstance } from '@/types/exhibition-management';
import { ArrowLeft, Save, Grid, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { StallLayout } from '@/components/exhibitions/StallLayout';
import {
  useStalls,
  useStallInstances,
  useCreateStall,
  useUpdateStall,
  useDeleteStall,
  useGenerateLayout,
  useUpdateStallInstance
} from '@/hooks/useStallsData';
import { useAuth } from '@/hooks/useAuth';
import { exhibitionNotificationService } from '@/services/exhibitionNotificationService';
import { Database } from '@/types/database.types';
import { supabase } from '@/integrations/supabase/client';

type Exhibition = Database['public']['Tables']['exhibitions']['Row'];
type ExhibitionUpdate = Database['public']['Tables']['exhibitions']['Update'];

const ExhibitionEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-details');
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch exhibition data
  const {
    data: exhibition,
    isLoading: isLoadingExhibition,
    error: exhibitionError
  } = useExhibition(id || '');

  // Add debug logging
  useEffect(() => {
    if (exhibition) {
      console.log('Exhibition data:', {
        exhibition,
        venue_type_id: exhibition.venue_type_id,
        event_type_id: exhibition.event_type_id
      });
    }
  }, [exhibition]);

  // Fetch stalls and stall instances
  const {
    data: stalls,
    isLoading: isLoadingStalls
  } = useStalls(id || '');

  const {
    data: stallInstances,
    isLoading: isLoadingInstances
  } = useStallInstances(id || '');

  // Fetch gallery images
  const {
    data: galleryImages,
    isLoading: isLoadingGallery
  } = useGalleryImages(id || '');

  // Fetch other required data
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();
  const { data: eventTypes = [], isLoading: isLoadingEventTypes } = useEventTypes();
  const { data: measuringUnits = [], isLoading: isLoadingUnits } = useMeasuringUnits();
  const { data: amenities = [], isLoading: isLoadingAmenities } = useAmenities();

  // Mutations
  const updateExhibitionMutation = useUpdateExhibition();
  const createStallMutation = useCreateStall(id || '');
  const updateStallMutation = useUpdateStall(id || '');
  const deleteStallMutation = useDeleteStall(id || '');
  const generateLayoutMutation = useGenerateLayout(id || '');
  const updateStallInstanceMutation = useUpdateStallInstance(id || '');

  if (isLoadingExhibition) {
    return <div className="text-center py-8">Loading exhibition details...</div>;
  }

  if (exhibitionError || !exhibition) {
    return (
      <div className="text-center py-8 text-red-500">
        {exhibitionError instanceof Error ? exhibitionError.message : 'Failed to load exhibition details'}
      </div>
    );
  }

  const handleUpdateExhibition = async (data: ExhibitionFormData) => {
    try {
      const { measuring_unit_id, ...exhibitionData } = data;
      const { data: updated, error } = await supabase
        .from('exhibitions')
        .update({
          ...exhibitionData,
          updated_at: new Date().toISOString()
        } as ExhibitionUpdate)
        .eq('id', id)
        .select()
        .single()
        .returns<Exhibition>();

      if (error) throw error;

      // Send notification to managers
      if (user && updated) {
        await exhibitionNotificationService.notifyManagerOfExhibitionUpdate(
          updated.id,
          updated.title,
          user.user_metadata?.full_name || user.email || 'Organiser'
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['exhibition', id] });

      toast({
        title: 'Success',
        description: 'Exhibition updated successfully',
      });
      navigate('/dashboard/organiser/exhibitions');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update exhibition',
        variant: 'destructive',
      });
    }
  };

  const handleCreateStall = async (data: StallFormData) => {
    try {
      if (editingStall) {
        await updateStallMutation.mutateAsync({ ...data, id: editingStall.id });
        setEditingStall(null);
      } else {
        await createStallMutation.mutateAsync(data);
      }
      toast({
        title: editingStall ? 'Stall updated' : 'Stall added',
        description: editingStall 
          ? 'The stall has been updated successfully.'
          : 'The stall has been added to your exhibition.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save stall',
        variant: 'destructive',
      });
    }
  };

  const handleEditStall = async (stallId: string, data: StallFormData) => {
    try {
      await updateStallMutation.mutateAsync({ ...data, id: stallId });
      toast({
        title: 'Stall updated',
        description: 'The stall has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stall',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStall = async (stallId: string) => {
    try {
      await deleteStallMutation.mutateAsync(stallId);
      
      // Refetch stalls and instances after deletion
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stalls', id] }),
        queryClient.invalidateQueries({ queryKey: ['stall_instances', id] })
      ]);

      toast({
        title: 'Success',
        description: 'The stall has been removed successfully.',
      });
    } catch (error) {
      console.error('Error deleting stall:', error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to delete stall. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to let StallConfiguration component handle the error state
    }
  };

  const handleGenerateLayout = async () => {
    try {
      await generateLayoutMutation.mutateAsync();
      toast({
        title: 'Layout generated',
        description: 'The stall layout has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate layout',
        variant: 'destructive',
      });
    }
  };

  const handleStallSelect = (instance: StallInstance) => {
    setSelectedInstanceId(instance.id);
  };

  const handleFinish = () => {
    toast({
      title: 'Exhibition updated',
      description: 'All changes have been saved successfully.',
    });
    navigate('/dashboard/organiser/exhibitions');
  };

  const handleUpdateStallPrice = async (instanceId: string, newPrice: number) => {
    try {
      const instance = stallInstances?.find(i => i.id === instanceId);
      if (!instance) throw new Error('Stall instance not found');

      // Update the stall instance price
      await updateStallInstanceMutation.mutateAsync({
        id: instanceId,
        price: newPrice
      });

      toast({
        title: 'Price updated',
        description: 'The stall price has been updated successfully.',
      });

      // Refetch instances
      await queryClient.invalidateQueries({ queryKey: ['stall_instances', id] });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update price',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStallStatus = async (instanceId: string, newStatus: string) => {
    try {
      console.log('Updating stall status:', { instanceId, newStatus });

      // Update in database
      const updatedInstance = await updateStallInstanceMutation.mutateAsync({
        id: instanceId,
        status: newStatus
      });

      console.log('Updated instance from mutation:', updatedInstance);

      // Update the local state to reflect the change immediately
      if (stallInstances) {
        const updatedInstances = stallInstances.map(instance => 
          instance.id === instanceId 
            ? { ...instance, status: newStatus }
            : instance
        );
        
        // Use correct query key
        queryClient.setQueryData(['stall_instances', id], updatedInstances);
      }

      // Force a refetch to ensure data is fresh
      await queryClient.invalidateQueries({ 
        queryKey: ['stall_instances', id],
        exact: true,
        refetchType: 'all'
      });

      toast({
        title: 'Status updated',
        description: 'Stall status has been updated successfully.'
      });

      // Log the current state after update
      console.log('Status update completed:', {
        newStatus,
        instanceId,
        currentInstances: queryClient.getQueryData(['stall_instances', id])
      });
    } catch (error) {
      console.error('Error updating stall status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stall status',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard/organiser/exhibitions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exhibitions
          </Button>
          <h1 className="text-2xl font-bold">Edit Exhibition</h1>
        </div>
        <Button onClick={handleFinish}>
          <Save className="h-4 w-4 mr-2" />
          Finish Editing
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic-details">1. Basic Details</TabsTrigger>
          <TabsTrigger value="stall-setup">2. Stall Setup</TabsTrigger>
          <TabsTrigger value="gallery">3. Gallery & Images</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-details">
          <Card>
            <CardHeader>
              <CardTitle>Exhibition Details</CardTitle>
              <CardDescription>
                Update your exhibition's basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExhibitionForm
                onSubmit={handleUpdateExhibition}
                categories={categories}
                venueTypes={venueTypes}
                eventTypes={eventTypes}
                measuringUnits={measuringUnits}
                isLoading={updateExhibitionMutation.isPending}
                initialData={exhibition}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stall-setup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stall Configuration</CardTitle>
                <CardDescription>
                  Configure and manage stalls for your exhibition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StallConfiguration
                  stalls={stalls || []}
                  stallInstances={stallInstances || []}
                  amenities={amenities}
                  measuringUnits={measuringUnits}
                  onAddStall={handleCreateStall}
                  onEditStall={handleEditStall}
                  onDeleteStall={handleDeleteStall}
                  onGenerateLayout={handleGenerateLayout}
                  onUpdatePrice={handleUpdateStallPrice}
                  onUpdateStatus={handleUpdateStallStatus}
                  isLoading={
                    createStallMutation.isPending || 
                    updateStallMutation.isPending || 
                    deleteStallMutation.isPending ||
                    generateLayoutMutation.isPending
                  }
                  exhibitionMeasuringUnitId={exhibition?.measuring_unit_id}
                />
              </CardContent>
            </Card>

            {/* Layout Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Exhibition Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <LayoutUpload
                  exhibitionId={id || ''}
                  existingImages={galleryImages || []}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Gallery & Images</CardTitle>
              <CardDescription>
                Upload and manage images for your exhibition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <GalleryUpload
                exhibitionId={id || ''}
                imageType="banner"
                existingImages={galleryImages?.filter(img => img.image_type === 'banner') || []}
                title="Banner Image"
                description="This image will be displayed at the top of your exhibition page. Recommended size: 1920x600px"
              />

              <GalleryUpload
                exhibitionId={id || ''}
                imageType="gallery"
                existingImages={galleryImages?.filter(img => img.image_type === 'gallery') || []}
                title="Gallery Images"
                description="Add photos showcasing your exhibition space and previous events"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExhibitionEdit; 