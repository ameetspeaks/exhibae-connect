-- Add cover_image_url to brand_profiles table
ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Update existing RLS policies to include cover_image_url
-- No need to modify policies as they already cover all columns 