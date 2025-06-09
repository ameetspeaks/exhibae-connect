import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExhibitionForm from '@/components/exhibitions/ExhibitionForm';
import StallForm from '@/components/exhibitions/StallForm';
import StallList from '@/components/exhibitions/StallList';
import { StallLayout } from '@/components/exhibitions/StallLayout';
import GalleryUpload from '@/components/exhibitions/GalleryUpload';
import LayoutUpload from '@/components/exhibitions/LayoutUpload';
import { 
  useCreateExhibition,
  useCategories,
  useVenueTypes,
  useExhibition,
  useUpdateExhibition,
  useMeasuringUnits,
  useEventTypes
} from '@/hooks/useExhibitionsData';
import { useCreateStall, useDeleteStall, useStalls } from '@/hooks/useStallsData';
import { useAmenities } from '@/hooks/useAmenitiesData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useToast } from '@/hooks/use-toast';
import { ExhibitionFormData, Stall, StallFormData, StallInstance, GalleryImage } from '@/types/exhibition-management';
import { ArrowLeft, Save, Loader2, Grid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { exhibitionNotificationService } from '@/services/exhibitionNotificationService';
import { useAuth } from '@/hooks/useAuth';

const CreateExhibition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-details');
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [createdExhibitionId, setCreatedExhibitionId] = useState<string | null>(null);
  const [showLayout, setShowLayout] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [stallInstances, setStallInstances] = useState<StallInstance[]>([]);
  
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();
  const { data: eventTypes = [], isLoading: isLoadingEventTypes } = useEventTypes();
  const { data: measuringUnits = [], isLoading: isLoadingUnits } = useMeasuringUnits();
  const { data: amenities = [], isLoading: isLoadingAmenities } = useAmenities();
  const { data: stalls = [], isLoading: isLoadingStalls } = useStalls(createdExhibitionId || undefined);
  const { data: exhibition } = useExhibition(createdExhibitionId || undefined);
  const { data: galleryImages = [] } = useGalleryImages(createdExhibitionId || '');
  
  const createExhibitionMutation = useCreateExhibition();
  const updateExhibitionMutation = useUpdateExhibition();
  const createStallMutation = useCreateStall(createdExhibitionId || '');
  const deleteStallMutation = useDeleteStall(createdExhibitionId || '');
  const { user } = useAuth();

  const handleCreateExhibition = async (data: ExhibitionFormData) => {
    try {
      const { measuring_unit_id, ...exhibitionData } = data;
      const created = await createExhibitionMutation.mutateAsync(exhibitionData);
      setCreatedExhibitionId(created.id);

      // Send notification to managers
      if (user) {
        await exhibitionNotificationService.notifyManagerOfNewExhibition(
          created.id,
          data.title,
          user.user_metadata?.full_name || user.email || 'Organiser',
          user.id
        );
      }

      toast({
        title: 'Exhibition created',
        description: 'Basic details have been saved. Continue with stall setup.',
      });
      setActiveTab('stall-setup');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create exhibition',
        variant: 'destructive',
      });
    }
  };

  const handleUnitSelect = async (unitId: string) => {
    if (!createdExhibitionId || !exhibition) return;

    try {
      const updateData: ExhibitionFormData & { exhibitionId: string } = {
        title: exhibition.title,
        description: exhibition.description,
        address: exhibition.address || '',
        city: exhibition.city || '',
        state: exhibition.state || '',
        country: exhibition.country || '',
        postal_code: exhibition.postal_code || '',
        organiser_id: exhibition.organiser_id,
        status: exhibition.status,
        start_date: new Date(exhibition.start_date).toISOString(),
        end_date: new Date(exhibition.end_date).toISOString(),
        start_time: exhibition.start_time || '11:00',
        end_time: exhibition.end_time || '17:00',
        category_id: exhibition.category_id || '',
        venue_type_id: exhibition.venue_type_id || '',
        event_type_id: exhibition.event_type_id || '',
        measuring_unit_id: unitId,
        exhibitionId: createdExhibitionId
      };

      await updateExhibitionMutation.mutateAsync(updateData);
      toast({
        title: 'Measuring unit set',
        description: 'The measuring unit has been set for this exhibition.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set measuring unit',
        variant: 'destructive',
      });
    }
  };

  const handleCreateStall = async (data: StallFormData) => {
    if (!createdExhibitionId) return;

    try {
      await createStallMutation.mutateAsync({
        ...data,
        status: 'available', // Set initial status as available
        exhibition_id: createdExhibitionId
      });
      toast({
        title: editingStall ? 'Stall updated' : 'Stall added',
        description: editingStall 
          ? 'The stall has been updated successfully.'
          : 'The stall has been added to your exhibition.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create stall',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStall = async (id: string) => {
    try {
      await deleteStallMutation.mutateAsync(id);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const handleEditStall = (stall: Stall) => {
    setEditingStall(stall);
  };

  const handleFinish = () => {
    toast({
      title: 'Exhibition created',
      description: 'Your exhibition has been created successfully.',
    });
    navigate('/dashboard/organiser/exhibitions');
  };

  const handleGenerateLayout = () => {
    if (!stalls || stalls.length === 0) {
      toast({
        title: 'No stalls',
        description: 'Please add some stalls before generating the layout.',
        variant: 'destructive'
      });
      return;
    }

    // Calculate layout dimensions
    const PADDING = 2; // Minimal padding between stalls
    const SCALE_FACTOR = 8; // Smaller scale factor for more compact layout
    const BOXES_PER_ROW = 5; // Target number of boxes per row
    const BOX_BASE_WIDTH = 100; // Base width for each box
    const BOX_BASE_HEIGHT = 80; // Base height for each box

    let currentX = PADDING;
    let currentY = PADDING;
    let instances = [];
    let boxesInCurrentRow = 0;

    // Get the measuring unit from the first stall since it's consistent across all stalls
    const unit = stalls[0]?.unit;

    // Generate instances with proper positioning
    for (const stall of stalls) {
      for (let i = 0; i < stall.quantity; i++) {
        // Start a new row if we've reached our target boxes per row
        if (boxesInCurrentRow >= BOXES_PER_ROW) {
          currentX = PADDING;
          currentY += BOX_BASE_HEIGHT + PADDING;
          boxesInCurrentRow = 0;
        }

        instances.push({
          id: `temp-${stall.id}-${i}`,
          stall_id: stall.id,
          exhibition_id: createdExhibitionId || '',
          instance_number: i + 1,
          position_x: currentX,
          position_y: currentY,
          status: 'available',
          stall: {
            ...stall,
            unit
          },
          rotation_angle: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Update position for next stall
        currentX += BOX_BASE_WIDTH + PADDING;
        boxesInCurrentRow++;
      }
    }

    setStallInstances(instances);
    setShowLayout(true);
    toast({
      title: 'Layout Generated',
      description: 'The stall layout has been generated based on your configuration.',
    });
  };

  const handleStallSelect = (instance: StallInstance) => {
    setSelectedInstanceId(instance.id);
    toast({
      title: 'Stall Selected',
      description: `Selected stall ${instance.instance_number}`,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/organiser/exhibitions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Create Exhibition</h1>
        </div>
        {createdExhibitionId && (
          <Badge variant={exhibition?.status === 'draft' ? 'secondary' : 'default'}>
            {exhibition?.status.charAt(0).toUpperCase() + exhibition?.status.slice(1)}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic-details" disabled={false}>
            1. Basic Details
          </TabsTrigger>
          <TabsTrigger 
            value="stall-setup" 
            disabled={!createdExhibitionId}
          >
            2. Stall Setup
          </TabsTrigger>
          <TabsTrigger 
            value="gallery-images" 
            disabled={!createdExhibitionId}
          >
            3. Gallery & Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic-details" className="space-y-4">
          <ExhibitionForm
            onSubmit={handleCreateExhibition}
            categories={categories}
            venueTypes={venueTypes}
            eventTypes={eventTypes}
            measuringUnits={measuringUnits}
            isLoading={createExhibitionMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="stall-setup">
          <div className="max-w-[800px] mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Stall Setup</CardTitle>
                <CardDescription>Configure your exhibition stalls</CardDescription>
                {exhibition?.measuring_unit_id && measuringUnits.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    All dimensions are in {measuringUnits.find(unit => unit.id === exhibition.measuring_unit_id)?.name} ({measuringUnits.find(unit => unit.id === exhibition.measuring_unit_id)?.symbol})
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingUnits ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading measuring units...</span>
                  </div>
                ) : measuringUnits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No measuring units available. Please contact the administrator.
                  </div>
                ) : (
                  <div className="space-y-8">
                    <StallForm
                      onSubmit={handleCreateStall}
                      initialData={editingStall || undefined}
                      amenities={amenities}
                      measuringUnits={measuringUnits}
                      isLoading={isLoadingUnits}
                      lockedUnitId={exhibition?.measuring_unit_id}
                      existingStalls={stalls}
                    />

                    {isLoadingStalls ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading stalls...</span>
                      </div>
                    ) : stalls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No stalls added yet. Use the configuration form to add stalls.
                      </div>
                    ) : (
                      <StallList
                        stalls={stalls}
                        onEdit={handleEditStall}
                        onDelete={handleDeleteStall}
                        isLoading={isLoadingStalls}
                      />
                    )}

                    {stalls.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Layout Generation</h3>
                          <Button
                            onClick={handleGenerateLayout}
                            variant="default"
                            size="default"
                            disabled={isLoadingStalls}
                            className="w-[200px]"
                          >
                            <Grid className="h-4 w-4 mr-2" />
                            Generate Layout
                          </Button>
                        </div>
                      </div>
                    )}

                    {showLayout && stallInstances.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Layout Preview</h3>
                        <div className="border rounded-lg p-4 overflow-x-auto">
                          <StallLayout
                            stallInstances={stallInstances}
                            selectedInstanceId={selectedInstanceId}
                            onStallSelect={handleStallSelect}
                            isEditable={true}
                            userRole="organiser"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery-images" className="space-y-6">
          {createdExhibitionId ? (
            <div className="space-y-6">
              <GalleryUpload
                exhibitionId={createdExhibitionId}
                imageType="banner"
                existingImages={galleryImages}
                title="Banner Image"
                description="Upload a banner image for your exhibition (Recommended size: 1920x600px)"
              />

              <GalleryUpload
                exhibitionId={createdExhibitionId}
                imageType="gallery"
                existingImages={galleryImages}
                title="Gallery Images"
                description="Upload additional images for your exhibition gallery"
              />

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('stall-setup')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                >
                  Finish
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please complete the basic details first.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateExhibition;
