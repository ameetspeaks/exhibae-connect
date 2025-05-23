-- Drop existing foreign key constraints if they exist
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_brand_id_fkey,
  DROP CONSTRAINT IF EXISTS conversations_organiser_id_fkey;

-- Update the foreign key relationships to use the profiles table
ALTER TABLE conversations
  ADD CONSTRAINT conversations_brand_id_fkey 
    FOREIGN KEY (brand_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT conversations_organiser_id_fkey 
    FOREIGN KEY (organiser_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Add indexes for the foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id 
  ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organiser_id 
  ON conversations(organiser_id); 