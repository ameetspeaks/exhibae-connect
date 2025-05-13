
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUploadGalleryImage, useDeleteGalleryImage } from '@/hooks/useGalleryData';
import { GalleryImage } from '@/types/exhibition-management';
import { Image, Upload, X } from 'lucide-react';

interface GalleryUploadProps {
  exhibitionId: string;
  imageType: string;
  existingImages: GalleryImage[];
  title: string;
  description?: string;
}

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        
        <Button variant="outline" className="flex items-center gap-2" onClick={() => document.getElementById(`file-upload-${imageType}`)?.click()}>
          <Upload className="h-4 w-4" />
          Upload
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
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <img 
                  src={image.image_url} 
                  alt={`${imageType} image`} 
                  className="w-full h-40 object-cover rounded"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-64 object-contain border rounded"
              />
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setSelectedImage(null);
                setPreviewImage(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadImage} 
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryUpload;
