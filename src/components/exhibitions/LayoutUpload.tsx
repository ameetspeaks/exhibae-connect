import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUploadGalleryImage, useDeleteGalleryImage } from '@/hooks/useGalleryData';
import { GalleryImage } from '@/types/exhibition-management';
import { Image, Upload, X, Loader2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface LayoutUploadProps {
  exhibitionId: string;
  existingImages: GalleryImage[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const LayoutUpload: React.FC<LayoutUploadProps> = ({
  exhibitionId,
  existingImages,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const uploadMutation = useUploadGalleryImage(exhibitionId, 'layout');
  const deleteMutation = useDeleteGalleryImage(exhibitionId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
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
        title: 'Layout image uploaded',
        description: 'Your layout image has been uploaded successfully',
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
        description: 'The layout image has been removed',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const layoutImages = existingImages.filter(img => img.image_type === 'layout');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Layout Images</h3>
          <p className="text-sm text-muted-foreground">Upload images showing the layout of your exhibition space (max 5MB per image)</p>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={() => document.getElementById('layout-upload')?.click()}
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
              Upload Layout
            </>
          )}
          <input 
            type="file" 
            id="layout-upload"
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
      </div>
      
      {layoutImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layoutImages.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <AspectRatio ratio={16/9}>
                  <img 
                    src={image.image_url} 
                    alt="Layout" 
                    className="w-full h-full object-contain rounded"
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
                </AspectRatio>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <div className="flex justify-center">
            <Image className="h-12 w-12 text-gray-400" />
          </div>
          <p className="mt-2 text-sm text-gray-600">No layout images uploaded yet</p>
          <p className="text-xs text-gray-500">Click upload to add layout images</p>
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Layout Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewImage && (
              <div className="relative border rounded overflow-hidden">
                <AspectRatio ratio={16/9}>
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                </AspectRatio>
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

export default LayoutUpload; 