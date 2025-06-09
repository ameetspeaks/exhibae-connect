import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage } from '@/types/exhibition-management';
import { v4 as uuidv4 } from '@lukeed/uuid';
import { Database } from '@/types/database.types';

type GalleryImageRow = Database['public']['Tables']['gallery_images']['Row'];
type GalleryImageInsert = Database['public']['Tables']['gallery_images']['Insert'];

export const useGalleryImages = (exhibitionId: string) => {
  return useQuery({
    queryKey: ['galleryImages', exhibitionId],
    queryFn: async () => {
      console.log('Fetching gallery images for exhibition:', exhibitionId);
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('exhibition_id', exhibitionId)
        .order('created_at');
      
      if (error) {
        console.error('Error fetching gallery images:', error);
        throw new Error(error.message);
      }
      
      const images = data as GalleryImageRow[];
      console.log('Raw gallery images data:', images);
      console.log('Gallery images with layout type:', images.filter(img => img.image_type === 'layout'));
      return images;
    },
    enabled: !!exhibitionId
  });
};

export const useUploadGalleryImage = (exhibitionId: string, imageType: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file provided');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${exhibitionId}/${fileName}`;
      
      console.log('Uploading gallery image:', {
        exhibitionId,
        imageType,
        fileName,
        filePath
      });
      
      // Upload file to storage
      const { error: uploadError } = await supabase
        .storage
        .from('exhibition-images')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(uploadError.message);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('exhibition-images')
        .getPublicUrl(filePath);
      
      console.log('Got public URL:', publicUrlData.publicUrl);
      
      // Save record in gallery_images table
      const newImage: GalleryImageInsert = {
        exhibition_id: exhibitionId,
        image_url: publicUrlData.publicUrl,
        image_type: imageType
      };
      
      const { data, error } = await supabase
        .from('gallery_images')
        .insert([newImage])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving gallery image record:', error);
        throw new Error(error.message);
      }
      
      const savedImage = data as GalleryImageRow;
      console.log('Successfully saved gallery image:', savedImage);
      return savedImage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages', exhibitionId] });
    }
  });
};

export const useDeleteGalleryImage = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (image: GalleryImage) => {
      // Extract the file path from the URL
      const urlParts = image.image_url.split('/');
      const filePath = `${exhibitionId}/${urlParts[urlParts.length - 1]}`;
      
      // Delete the image from storage
      const { error: storageError } = await supabase
        .storage
        .from('exhibition-images')
        .remove([filePath]);
      
      if (storageError) {
        throw new Error(storageError.message);
      }
      
      // Delete the image record from the database
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', image.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return image.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages', exhibitionId] });
    }
  });
};

export const useUpdateGalleryImageTypes = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('Updating gallery image types for exhibition:', exhibitionId);
      
      // First, get all gallery images for this exhibition
      const { data: images, error: fetchError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('exhibition_id', exhibitionId);
      
      if (fetchError) {
        console.error('Error fetching gallery images:', fetchError);
        throw new Error(fetchError.message);
      }
      
      if (!images || images.length === 0) {
        console.log('No gallery images found for this exhibition');
        return [];
      }
      
      console.log('Found gallery images:', images);
      
      // Update all images to have image_type = 'layout'
      const { data: updatedImages, error: updateError } = await supabase
        .from('gallery_images')
        .update({ image_type: 'layout' })
        .eq('exhibition_id', exhibitionId)
        .select();
      
      if (updateError) {
        console.error('Error updating gallery images:', updateError);
        throw new Error(updateError.message);
      }
      
      console.log('Successfully updated gallery images:', updatedImages);
      return updatedImages as GalleryImageRow[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryImages', exhibitionId] });
    }
  });
};
