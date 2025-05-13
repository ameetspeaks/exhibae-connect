import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExhibition } from '@/hooks/useExhibitionsData';
import { useStalls } from '@/hooks/useStallsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { ArrowLeft, Calendar, MapPin, Pencil, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

const ExhibitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    data: exhibition,
    isLoading: isLoadingExhibition,
    error: exhibitionError
  } = useExhibition(id || '');
  
  const {
    data: stalls,
    isLoading: isLoadingStalls
  } = useStalls(id || '');
  
  const {
    data: galleryImages,
    isLoading: isLoadingGallery
  } = useGalleryImages(id || '');

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

  const bannerImage = galleryImages?.find(img => img.image_type === 'banner')?.image_url;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{exhibition.title}</h2>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={
            exhibition.status === 'published' ? 'bg-green-100 text-green-800' :
            exhibition.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            exhibition.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }>
            {exhibition.status.charAt(0).toUpperCase() + exhibition.status.slice(1)}
          </Badge>
          <Button variant="outline" asChild>
            <a href={`/dashboard/manager/exhibitions/${id}/applications`}>
              <ClipboardList className="h-4 w-4 mr-2" />
              View Applications
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/dashboard/manager/exhibitions/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </a>
          </Button>
        </div>
      </div>

      {bannerImage && (
        <div className="relative w-full h-64 overflow-hidden rounded-lg">
          <img 
            src={bannerImage} 
            alt={exhibition.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Exhibition Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Description</h3>
                <p className="text-muted-foreground">{exhibition.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium">Date & Time</h3>
                  <p className="text-sm">
                    {exhibition.start_date && format(new Date(exhibition.start_date), 'MMMM d, yyyy')} - {exhibition.end_date && format(new Date(exhibition.end_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-sm">
                    {exhibition.address}, {exhibition.city}, {exhibition.state}, {exhibition.country}
                    {exhibition.postal_code && `, ${exhibition.postal_code}`}
                  </p>
                </div>
              </div>

              {exhibition.category && (
                <div>
                  <h3 className="font-medium">Category</h3>
                  <p className="text-sm">{exhibition.category.name}</p>
                </div>
              )}

              {exhibition.venue_type && (
                <div>
                  <h3 className="font-medium">Venue Type</h3>
                  <p className="text-sm">{exhibition.venue_type.name}</p>
                </div>
              )}

              {exhibition.organiser && (
                <div>
                  <h3 className="font-medium">Organiser</h3>
                  <p className="text-sm">{exhibition.organiser.full_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Stall Information</CardTitle>
              <CardDescription>
                {isLoadingStalls ? 'Loading stalls...' : `${stalls?.length || 0} stall types configured`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStalls ? (
                <div className="text-center py-4">Loading stalls...</div>
              ) : !stalls || stalls.length === 0 ? (
                <div className="text-center py-4">No stalls have been added yet.</div>
              ) : (
                <div className="space-y-4">
                  {stalls.map(stall => (
                    <Card key={stall.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{stall.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stall.length} × {stall.width} {stall.unit?.abbreviation || ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${stall.price.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">{stall.quantity} available</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGallery ? (
                <div className="text-center py-4">Loading gallery...</div>
              ) : !galleryImages || galleryImages.length === 0 ? (
                <div className="text-center py-4">No images have been added yet.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.filter(img => img.image_type === 'gallery').slice(0, 4).map(image => (
                    <div key={image.id} className="aspect-square">
                      <img 
                        src={image.image_url} 
                        alt="Gallery" 
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                  {galleryImages.filter(img => img.image_type === 'gallery').length > 4 && (
                    <div className="col-span-2 text-center mt-2">
                      <Button variant="outline" size="sm">
                        View all {galleryImages.filter(img => img.image_type === 'gallery').length} images
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Layout Images</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGallery ? (
                <div className="text-center py-4">Loading layout images...</div>
              ) : !galleryImages || galleryImages.filter(img => img.image_type === 'layout').length === 0 ? (
                <div className="text-center py-4">No layout images have been added.</div>
              ) : (
                <div className="space-y-2">
                  {galleryImages.filter(img => img.image_type === 'layout').map(image => (
                    <img 
                      key={image.id}
                      src={image.image_url} 
                      alt="Layout" 
                      className="w-full h-auto rounded"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionDetail; 