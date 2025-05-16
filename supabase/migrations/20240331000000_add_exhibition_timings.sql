-- Disable triggers temporarily
SET session_replication_role = replica;

-- Add start_time and end_time columns to exhibitions table
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '11:00:00',
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '17:00:00';

-- Update existing rows to have default times
UPDATE exhibitions
SET start_time = '11:00:00',
    end_time = '17:00:00'
WHERE start_time IS NULL OR end_time IS NULL;

-- Make the columns non-nullable
ALTER TABLE exhibitions
ALTER COLUMN start_time SET NOT NULL,
ALTER COLUMN end_time SET NOT NULL;

-- Add a check constraint to ensure end_time is after start_time
ALTER TABLE exhibitions
ADD CONSTRAINT valid_exhibition_times CHECK (end_time > start_time);

-- Enable triggers again
SET session_replication_role = DEFAULT; 