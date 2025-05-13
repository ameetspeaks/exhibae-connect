import { useParams } from 'react-router-dom';
import { useExhibition } from '@/hooks/useExhibitionsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useStalls } from '@/hooks/useStallsData';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ExhibitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: exhibition, isLoading: isLoadingExhibition } = useExhibition(id!);
  const { data: galleryImages } = useGalleryImages(id!);
  const { data: stalls } = useStalls(id!);

  if (isLoadingExhibition) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Exhibition not found</p>
      </div>
    );
  }

  const bannerImage = galleryImages?.find(img => img.image_type === 'banner')?.image_url;
  const galleryPhotos = galleryImages?.filter(img => img.image_type === 'gallery') || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="relative mb-8">
        <AspectRatio ratio={21/9}>
          <img 
            src={bannerImage || '/placeholder-banner.jpg'} 
            alt={exhibition.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </AspectRatio>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-4xl font-bold text-white mb-2">{exhibition.title}</h1>
          <div className="flex flex-wrap gap-2">
            {exhibition.category && (
              <Badge variant="secondary" className="text-sm">
                <Tag className="w-4 h-4 mr-1" />
                {exhibition.category.name}
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {exhibition.city}, {exhibition.country}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="stalls">Stalls</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About the Exhibition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-lg text-muted-foreground">{exhibition.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle>Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  {galleryPhotos.length > 0 ? (
                    <Carousel>
                      <CarouselContent>
                        {galleryPhotos.map((image) => (
                          <CarouselItem key={image.id}>
                            <AspectRatio ratio={16/9}>
                              <img 
                                src={image.image_url} 
                                alt="Gallery" 
                                className="w-full h-full object-cover rounded-md"
                              />
                            </AspectRatio>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  ) : (
                    <p className="text-muted-foreground">No gallery photos available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stalls">
              <Card>
                <CardHeader>
                  <CardTitle>Available Stalls</CardTitle>
                </CardHeader>
                <CardContent>
                  {stalls && stalls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stalls.map((stall) => (
                        <Card key={stall.id}>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{stall.name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Size: {stall.length}x{stall.width} {stall.unit?.symbol}</p>
                              <p>Price: ${stall.price}</p>
                              <p>Available: {stall.quantity}</p>
                            </div>
                            <Button className="mt-4 w-full">Apply for Stall</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No stalls available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {exhibition.address}<br />
                      {exhibition.city}, {exhibition.state} {exhibition.postal_code}<br />
                      {exhibition.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-muted-foreground">
                      Start: {format(new Date(exhibition.start_date), 'MMMM d, yyyy')}<br />
                      End: {format(new Date(exhibition.end_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {exhibition.venue_type && (
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Venue Type</p>
                      <p className="text-sm text-muted-foreground">{exhibition.venue_type.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Button className="w-full" size="lg">
                Register Interest
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 