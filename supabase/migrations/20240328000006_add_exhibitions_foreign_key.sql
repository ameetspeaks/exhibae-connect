-- Disable triggers temporarily
SET session_replication_role = replica;

-- Add foreign key constraint for organiser_id
ALTER TABLE exhibitions 
ADD CONSTRAINT exhibitions_organiser_id_fkey 
FOREIGN KEY (organiser_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_organiser_id ON exhibitions(organiser_id);

-- Enable triggers again
SET session_replication_role = DEFAULT; 