import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExhibitionForm from '@/components/exhibitions/ExhibitionForm';
import StallForm from '@/components/exhibitions/StallForm';
import StallList from '@/components/exhibitions/StallList';
import StallLayout from '@/components/exhibitions/StallLayout';
import GalleryUpload from '@/components/exhibitions/GalleryUpload';
import { 
  useCreateExhibition,
  useCategories,
  useVenueTypes,
  useExhibition,
  useUpdateExhibition
} from '@/hooks/useExhibitionsData';
import { useMeasuringUnits } from '@/hooks/useExhibitionsData';
import { useCreateStall, useDeleteStall, useStalls } from '@/hooks/useStallsData';
import { useAmenities } from '@/hooks/useAmenitiesData';
import { useToast } from '@/hooks/use-toast';
import { ExhibitionFormData, Stall, StallFormData } from '@/types/exhibition-management';
import { ArrowLeft, Save, Loader2, Grid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CreateExhibition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-details');
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [createdExhibitionId, setCreatedExhibitionId] = useState<string | null>(null);
  const [showLayout, setShowLayout] = useState(false);
  
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();
  const { data: measuringUnits = [], isLoading: isLoadingUnits } = useMeasuringUnits();
  const { data: amenities = [], isLoading: isLoadingAmenities } = useAmenities();
  const { data: stalls = [], isLoading: isLoadingStalls } = useStalls(createdExhibitionId || '');
  const { data: exhibition } = useExhibition(createdExhibitionId || '');
  
  const createExhibitionMutation = useCreateExhibition();
  const updateExhibitionMutation = useUpdateExhibition(createdExhibitionId || '');
  const createStallMutation = useCreateStall(createdExhibitionId || '');
  const deleteStallMutation = useDeleteStall(createdExhibitionId || '');

  const handleCreateExhibition = async (data: ExhibitionFormData) => {
    try {
      const { measuring_unit_id, ...exhibitionData } = data;
      const created = await createExhibitionMutation.mutateAsync(exhibitionData);
      setCreatedExhibitionId(created.id);
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
      await updateExhibitionMutation.mutateAsync({
        ...exhibition,
        measuring_unit_id: unitId,
        start_date: new Date(exhibition.start_date),
        end_date: new Date(exhibition.end_date)
      });
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
      if (editingStall) {
        // Handle stall update when implemented
        console.log('Updating existing stall - not implemented yet');
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
    setShowLayout(true);
    toast({
      title: 'Layout Generated',
      description: 'The stall layout has been generated based on your configuration.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Create Exhibition</h2>
        </div>
        <Button onClick={handleFinish} disabled={!createdExhibitionId}>
          <Save className="h-4 w-4 mr-2" />
          Finish & Save
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic-details">1. Basic Details</TabsTrigger>
          <TabsTrigger 
            value="stall-setup" 
            disabled={!createdExhibitionId}
          >
            2. Stall Setup
          </TabsTrigger>
          <TabsTrigger 
            value="gallery" 
            disabled={!createdExhibitionId}
          >
            3. Gallery & Images
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
                isLoading={createExhibitionMutation.isPending || isLoadingCategories || isLoadingVenueTypes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stall-setup">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Stall Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle>Stall Configuration</CardTitle>
                {exhibition?.measuring_unit && (
                  <p className="text-sm text-muted-foreground">
                    All dimensions are in {exhibition.measuring_unit.name} ({exhibition.measuring_unit.abbreviation})
                  </p>
                )}
              </CardHeader>
              <CardContent>
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
                  <StallForm 
                    onSubmit={handleCreateStall}
                    initialData={editingStall || undefined}
                    amenities={amenities}
                    measuringUnits={measuringUnits}
                    isLoading={createStallMutation.isPending || isLoadingAmenities}
                  />
                )}
              </CardContent>
            </Card>

            {/* All Stalls Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Stalls</CardTitle>
                  {stalls.length > 0 && !showLayout && (
                    <Button onClick={handleGenerateLayout}>
                      <Grid className="h-4 w-4 mr-2" />
                      Generate Layout
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStalls ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : stalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No stalls added yet. Use the configuration form above to add stalls.
                  </div>
                ) : (
                  <StallList 
                    stalls={stalls} 
                    onEdit={handleEditStall}
                    onDelete={handleDeleteStall}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stall Layout Section */}
            {showLayout && (
              <Card>
                <CardHeader>
                  <CardTitle>Stall Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <StallLayout 
                    exhibitionId={createdExhibitionId || ''} 
                    stalls={stalls}
                  />
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="flex justify-end mt-8">
            <Button onClick={() => setActiveTab('gallery')} disabled={stalls.length === 0}>
              Continue to Gallery
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Exhibition Gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <GalleryUpload 
                exhibitionId={createdExhibitionId || ''}
                imageType="banner"
                existingImages={[]}
                title="Banner Image"
                description="This image will be displayed as the main banner for your exhibition."
              />

              <GalleryUpload 
                exhibitionId={createdExhibitionId || ''}
                imageType="layout"
                existingImages={[]}
                title="Layout Images"
                description="Upload images of the exhibition layout or floor plan."
              />

              <GalleryUpload 
                exhibitionId={createdExhibitionId || ''}
                imageType="gallery"
                existingImages={[]}
                title="Gallery Images"
                description="Add additional images to showcase your exhibition."
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-6">
            <Button onClick={handleFinish}>
              <Save className="h-4 w-4 mr-2" />
              Finish & Save
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateExhibition;
