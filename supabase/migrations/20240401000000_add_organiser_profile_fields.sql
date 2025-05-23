-- Disable triggers temporarily
SET session_replication_role = replica;

-- Add new fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendees_hosted INTEGER DEFAULT 0;

-- Create or replace function to handle profile updates
CREATE OR REPLACE FUNCTION get_organiser_stats(organiser_id UUID)
RETURNS RECORD
LANGUAGE plpgsql
AS $$
DECLARE
    result RECORD;
BEGIN
    -- Get follower count and attendees hosted
    SELECT
        COALESCE(count(DISTINCT ei.brand_id), 0) AS followers_count,
        COALESCE(sum(e.attendee_count), 0) AS attendees_hosted
    INTO result
    FROM
        profiles p
    LEFT JOIN
        exhibitions e ON p.id = e.organiser_id
    LEFT JOIN
        exhibition_interests ei ON e.id = ei.exhibition_id
    WHERE
        p.id = organiser_id
    GROUP BY
        p.id;
    
    RETURN result;
END;
$$;

-- Add default values to existing organiser profiles
UPDATE profiles
SET 
    description = 'We organize exhibitions to connect brands with their audience.',
    followers_count = 100 + floor(random() * 900)::int,
    attendees_hosted = 1000 + floor(random() * 9000)::int
WHERE
    role = 'organiser'
    AND (description IS NULL OR description = '');

-- Enable triggers again
SET session_replication_role = DEFAULT; 