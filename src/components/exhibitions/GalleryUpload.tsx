import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUploadGalleryImage, useDeleteGalleryImage } from '@/hooks/useGalleryData';
import { GalleryImage } from '@/types/exhibition-management';
import { Image, Upload, X, Loader2 } from 'lucide-react';

interface GalleryUploadProps {
  exhibitionId: string;
  imageType: string;
  existingImages: GalleryImage[];
  title: string;
  description?: string;
}

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Image dimensions requirements
const IMAGE_REQUIREMENTS = {
  banner: {
    width: 1920,
    height: 600,
    aspectRatio: 3.2, // 1920:600
    tolerance: 0.1 // 10% tolerance for aspect ratio
  },
  gallery: {
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    aspectRatio: 16/9,
    tolerance: 0.1, // 10% tolerance for aspect ratio
    maxSize: '5MB'
  }
};

const GalleryUpload: React.FC<GalleryUploadProps> = ({
  exhibitionId,
  imageType,
  existingImages,
  title,
  description,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const uploadMutation = useUploadGalleryImage(exhibitionId, imageType);
  const deleteMutation = useDeleteGalleryImage(exhibitionId);

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        if (imageType === 'banner') {
          const aspectRatio = img.width / img.height;
          const targetRatio = IMAGE_REQUIREMENTS.banner.aspectRatio;
          const withinTolerance = Math.abs(aspectRatio - targetRatio) <= IMAGE_REQUIREMENTS.banner.tolerance;
          
          if (!withinTolerance) {
            toast({
              title: 'Invalid image dimensions',
              description: `Banner image should be ${IMAGE_REQUIREMENTS.banner.width}x${IMAGE_REQUIREMENTS.banner.height}px (3.2:1 aspect ratio)`,
              variant: 'destructive',
            });
            resolve(false);
            return;
          }
        } else if (imageType === 'gallery') {
          const aspectRatio = img.width / img.height;
          const targetRatio = IMAGE_REQUIREMENTS.gallery.aspectRatio;
          const withinTolerance = Math.abs(aspectRatio - targetRatio) <= IMAGE_REQUIREMENTS.gallery.tolerance;

          if (img.width < IMAGE_REQUIREMENTS.gallery.minWidth || img.height < IMAGE_REQUIREMENTS.gallery.minHeight) {
            toast({
              title: 'Image too small',
              description: `Gallery images should be at least ${IMAGE_REQUIREMENTS.gallery.minWidth}x${IMAGE_REQUIREMENTS.gallery.minHeight}px`,
              variant: 'destructive',
            });
            resolve(false);
            return;
          }

          if (!withinTolerance) {
            toast({
              title: 'Invalid aspect ratio',
              description: `Gallery images should have a 16:9 aspect ratio (e.g. ${IMAGE_REQUIREMENTS.gallery.width}x${IMAGE_REQUIREMENTS.gallery.height}px)`,
              variant: 'destructive',
            });
            resolve(false);
            return;
          }
        }
        resolve(true);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${IMAGE_REQUIREMENTS.gallery.maxSize}`,
          variant: 'destructive',
        });
        return;
      }

      // Validate image dimensions
      const isValidDimensions = await validateImageDimensions(file);
      if (!isValidDimensions) {
        return;
      }

      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      setIsDialogOpen(true);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) return;

    try {
      await uploadMutation.mutateAsync(selectedImage);
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully',
      });
      setIsDialogOpen(false);
      setSelectedImage(null);
      setPreviewImage(null);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteImage = async (image: GalleryImage) => {
    try {
      await deleteMutation.mutateAsync(image);
      toast({
        title: 'Image deleted',
        description: 'The image has been removed',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const filteredImages = existingImages.filter(img => img.image_type === imageType);

  const getImageRequirements = () => {
    if (imageType === 'banner') {
      return `Banner image should be ${IMAGE_REQUIREMENTS.banner.width}x${IMAGE_REQUIREMENTS.banner.height}px (3.2:1 aspect ratio). Maximum file size: ${IMAGE_REQUIREMENTS.gallery.maxSize}`;
    }
    return `Gallery images should be 16:9 aspect ratio (recommended: ${IMAGE_REQUIREMENTS.gallery.width}x${IMAGE_REQUIREMENTS.gallery.height}px), minimum ${IMAGE_REQUIREMENTS.gallery.minWidth}x${IMAGE_REQUIREMENTS.gallery.minHeight}px. Maximum file size: ${IMAGE_REQUIREMENTS.gallery.maxSize}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description || getImageRequirements()}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={() => document.getElementById(`file-upload-${imageType}`)?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload
            </>
          )}
          <input 
            type="file" 
            id={`file-upload-${imageType}`}
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
      </div>
      
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <img 
                    src={image.image_url} 
                    alt={`${imageType} image`} 
                    className="w-full h-full object-cover rounded transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="transition-transform duration-200 scale-75 group-hover:scale-100"
                      onClick={() => handleDeleteImage(image)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <div className="flex justify-center">
            <Image className="h-12 w-12 text-gray-400" />
          </div>
          <p className="mt-2 text-sm text-gray-600">No images uploaded yet</p>
          <p className="text-xs text-gray-500">Click upload to add images</p>
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewImage && (
              <div className="relative border rounded overflow-hidden">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-64 object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedImage(null);
                  setPreviewImage(null);
                }}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUploadImage} 
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryUpload;
