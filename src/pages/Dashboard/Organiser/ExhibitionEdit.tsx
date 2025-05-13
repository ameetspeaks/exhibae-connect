import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExhibitionForm from '@/components/exhibitions/ExhibitionForm';
import StallForm from '@/components/exhibitions/StallForm';
import StallList from '@/components/exhibitions/StallList';
import StallLayout from '@/components/exhibitions/StallLayout';
import GalleryUpload from '@/components/exhibitions/GalleryUpload';
import { 
  useExhibition,
  useUpdateExhibition,
  useCategories,
  useVenueTypes
} from '@/hooks/useExhibitionsData';
import { useStalls, useCreateStall, useUpdateStall, useDeleteStall } from '@/hooks/useStallsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useMeasuringUnits } from '@/hooks/useExhibitionsData';
import { useAmenities } from '@/hooks/useAmenitiesData';
import { useToast } from '@/hooks/use-toast';
import { ExhibitionFormData, Stall, StallFormData } from '@/types/exhibition-management';
import { ArrowLeft, Save } from 'lucide-react';

const ExhibitionEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-details');
  const [editingStall, setEditingStall] = useState<Stall | null>(null);

  // Fetch exhibition data
  const {
    data: exhibition,
    isLoading: isLoadingExhibition,
    error: exhibitionError
  } = useExhibition(id || '');

  // Fetch stalls
  const {
    data: stalls,
    isLoading: isLoadingStalls
  } = useStalls(id || '');

  // Fetch gallery images
  const {
    data: galleryImages,
    isLoading: isLoadingGallery
  } = useGalleryImages(id || '');

  // Fetch other required data
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: venueTypes = [], isLoading: isLoadingVenueTypes } = useVenueTypes();
  const { data: measuringUnits = [], isLoading: isLoadingUnits } = useMeasuringUnits();
  const { data: amenities = [], isLoading: isLoadingAmenities } = useAmenities();

  // Mutations
  const updateExhibitionMutation = useUpdateExhibition();
  const createStallMutation = useCreateStall(id || '');
  const updateStallMutation = useUpdateStall(id || '');
  const deleteStallMutation = useDeleteStall(id || '');

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
      await updateExhibitionMutation.mutateAsync({ id: id || '', ...data });
      toast({
        title: 'Exhibition updated',
        description: 'Exhibition details have been saved successfully.',
      });
      setActiveTab('stall-setup');
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
        await updateStallMutation.mutateAsync({ id: editingStall.id, ...data });
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

  const handleDeleteStall = async (stallId: string) => {
    try {
      await deleteStallMutation.mutateAsync(stallId);
      toast({
        title: 'Stall deleted',
        description: 'The stall has been removed from your exhibition.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete stall',
        variant: 'destructive',
      });
    }
  };

  const handleEditStall = (stall: Stall) => {
    setEditingStall(stall);
  };

  const handleFinish = () => {
    toast({
      title: 'Exhibition updated',
      description: 'All changes have been saved successfully.',
    });
    navigate('/dashboard/organiser/exhibitions');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Edit Exhibition</h2>
        </div>
        <Button onClick={handleFinish}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
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
            </CardHeader>
            <CardContent>
              <ExhibitionForm 
                onSubmit={handleUpdateExhibition}
                initialData={exhibition}
                categories={categories}
                venueTypes={venueTypes}
                isLoading={updateExhibitionMutation.isPending || isLoadingCategories || isLoadingVenueTypes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stall-setup">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{editingStall ? 'Update Stall' : 'Add Stall'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StallForm 
                    onSubmit={handleCreateStall}
                    initialData={editingStall || undefined}
                    measuringUnits={measuringUnits}
                    amenities={amenities}
                    isLoading={
                      createStallMutation.isPending || 
                      updateStallMutation.isPending || 
                      isLoadingUnits || 
                      isLoadingAmenities
                    }
                  />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stall List</CardTitle>
                </CardHeader>
                <CardContent>
                  <StallList 
                    stalls={stalls || []}
                    onEdit={handleEditStall}
                    onDelete={handleDeleteStall}
                    isLoading={isLoadingStalls}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Layout Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <StallLayout stalls={stalls || []} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Gallery & Images</CardTitle>
            </CardHeader>
            <CardContent>
              <GalleryUpload 
                exhibitionId={id || ''}
                existingImages={galleryImages || []}
                isLoading={isLoadingGallery}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExhibitionEdit; 