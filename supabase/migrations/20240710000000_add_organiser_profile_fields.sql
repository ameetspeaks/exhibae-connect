-- Disable triggers temporarily
SET session_replication_role = replica;

-- Add new fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Create storage bucket for organiser assets if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'organiser-assets'
    ) THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('organiser-assets', 'organiser-assets', true);
    END IF;
END $$;

-- Enable RLS on the bucket and create policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Organisers can manage their own assets'
    ) THEN
        CREATE POLICY "Organisers can manage their own assets"
        ON storage.objects
        FOR ALL USING (
            bucket_id = 'organiser-assets' AND 
            (auth.uid() = owner OR auth.uid() IN (
                SELECT id FROM profiles WHERE role = 'organiser' AND id = SPLIT_PART(name, '/', 1)::uuid
            ))
        );
    END IF;
END $$;

-- Enable triggers again
SET session_replication_role = DEFAULT; 