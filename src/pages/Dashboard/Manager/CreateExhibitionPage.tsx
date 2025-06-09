import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { unifiedNotificationService } from '@/services/unifiedNotificationService';
import { useAuth } from '@/hooks/useAuth';

const CreateExhibitionPage = () => {
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
        await unifiedNotificationService.notifyExhibitionCreated(
          created.id,
          data.title,
          user.user_metadata?.full_name || user.email || 'Manager',
          user.email || '',
          user.email || ''
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
    navigate('/dashboard/manager/exhibitions');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/manager/exhibitions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        <h1 className="text-3xl font-bold">Create Exhibition</h1>
        </div>
        {createdExhibitionId && (
          <Button onClick={handleFinish}>
            <Save className="h-4 w-4 mr-2" />
            Finish
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic-details">
            Basic Details
            {createdExhibitionId && <Badge variant="success" className="ml-2">Saved</Badge>}
          </TabsTrigger>
          <TabsTrigger value="stall-setup" disabled={!createdExhibitionId}>
            Stall Setup
          </TabsTrigger>
          <TabsTrigger value="gallery" disabled={!createdExhibitionId}>
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic-details">
      <Card>
        <CardHeader>
          <CardTitle>Exhibition Details</CardTitle>
        </CardHeader>
        <CardContent>
              <ExhibitionForm
                onSubmit={handleCreateExhibition}
                categories={categories}
                venueTypes={venueTypes}
                eventTypes={eventTypes}
                measuringUnits={measuringUnits}
                isLoading={createExhibitionMutation.isPending}
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
              </CardHeader>
              <CardContent>
                <StallForm 
                  onSubmit={handleCreateStall}
                  initialData={editingStall || undefined}
                  amenities={amenities}
                  measuringUnits={measuringUnits}
                  isLoading={createStallMutation.isPending || isLoadingAmenities}
                />
                {stalls && stalls.length > 0 && (
                  <div className="mt-8">
                    <StallList
                      stalls={stalls}
                      onEdit={handleEditStall}
                      onDelete={handleDeleteStall}
                      isLoading={isLoadingStalls}
                  />
                </div>
                )}
              </CardContent>
            </Card>

            {/* Layout Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Exhibition Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <LayoutUpload
                  exhibitionId={createdExhibitionId || ''}
                  existingImages={galleryImages}
                />
              </CardContent>
            </Card>
              </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Images</CardTitle>
            </CardHeader>
            <CardContent>
              <GalleryUpload
                exhibitionId={createdExhibitionId || ''}
                existingImages={galleryImages}
              />
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateExhibitionPage; 