-- Drop existing foreign key constraint
ALTER TABLE brand_favorites
DROP CONSTRAINT IF EXISTS brand_favorites_brand_id_fkey;

-- Add new foreign key constraint referencing brand_profiles
ALTER TABLE brand_favorites
ADD CONSTRAINT brand_favorites_brand_id_fkey
FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE CASCADE;

-- Update RLS policies to check against brand_profiles
DROP POLICY IF EXISTS "Users can add favorites" ON brand_favorites;
CREATE POLICY "Users can add favorites"
  ON brand_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM brand_profiles bp
      WHERE bp.id = brand_id
    )
  );

-- Recreate indexes if needed
CREATE INDEX IF NOT EXISTS idx_brand_favorites_brand_id ON brand_favorites(brand_id); 