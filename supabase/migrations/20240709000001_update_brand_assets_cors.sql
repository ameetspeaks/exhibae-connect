-- Ensure bucket exists with CORS configuration
DO $$
BEGIN
  INSERT INTO storage.buckets (
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    owner,
    created_at,
    updated_at,
    avif_autodetection,
    owner_id
  )
  VALUES (
    'brand_assets',
    'brand_assets',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    null,
    now(),
    now(),
    false,
    null
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    updated_at = now();
END $$;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow public read access to brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete brand assets" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow public read access to brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand_assets');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated users to upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand_assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand_assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'brand_assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand_assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
); 