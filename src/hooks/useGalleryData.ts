
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage } from '@/types/exhibition-management';
import { v4 as uuidv4 } from '@lukeed/uuid';

export const useGalleryImages = (exhibitionId: string) => {
  return useQuery({
    queryKey: ['galleryImages', exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('exhibition_id', exhibitionId)
        .order('created_at');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as GalleryImage[];
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
      
      // Upload file to storage
      const { error: uploadError } = await supabase
        .storage
        .from('exhibition-images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('exhibition-images')
        .getPublicUrl(filePath);
      
      // Save record in gallery_images table
      const { data, error } = await supabase
        .from('gallery_images')
        .insert([{
          exhibition_id: exhibitionId,
          image_url: publicUrlData.publicUrl,
          image_type: imageType
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as GalleryImage;
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
