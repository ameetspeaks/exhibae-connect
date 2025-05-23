-- Drop existing foreign key constraints
ALTER TABLE exhibition_interests
  DROP CONSTRAINT IF EXISTS exhibition_interests_brand_id_fkey;

-- Update the foreign key relationship to use profiles
ALTER TABLE exhibition_interests
  ADD CONSTRAINT exhibition_interests_brand_id_fkey 
    FOREIGN KEY (brand_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Add index for the foreign key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_exhibition_interests_brand_id 
  ON exhibition_interests(brand_id); 