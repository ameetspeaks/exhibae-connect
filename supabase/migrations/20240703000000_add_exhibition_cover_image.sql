-- Disable triggers temporarily
SET session_replication_role = replica;

-- Add cover_image column to exhibitions table
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 