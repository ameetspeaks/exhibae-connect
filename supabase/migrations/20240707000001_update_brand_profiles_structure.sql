-- Add separate social media columns and ensure logo/cover image columns exist
ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Migrate existing social media data to new columns
UPDATE brand_profiles
SET 
    facebook_url = social_media->>'facebook',
    instagram_url = social_media->>'instagram',
    twitter_url = social_media->>'twitter',
    linkedin_url = social_media->>'linkedin'
WHERE social_media IS NOT NULL;

-- Drop the social_media JSONB column
ALTER TABLE brand_profiles
DROP COLUMN IF EXISTS social_media;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_profiles_facebook_url ON brand_profiles(facebook_url);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_instagram_url ON brand_profiles(instagram_url);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_twitter_url ON brand_profiles(twitter_url);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_linkedin_url ON brand_profiles(linkedin_url); 