-- Add threads_url column to brand_profiles table
ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS threads_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_brand_profiles_threads_url ON brand_profiles(threads_url); 