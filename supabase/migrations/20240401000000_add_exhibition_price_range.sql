-- Disable triggers temporarily
SET session_replication_role = replica;

-- Add price_range column to exhibitions table
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS price_range TEXT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 