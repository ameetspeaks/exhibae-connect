-- Create brand_favorites table
CREATE TABLE IF NOT EXISTS brand_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_brand_favorite UNIQUE (user_id, brand_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_favorites_user_id ON brand_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_favorites_brand_id ON brand_favorites(brand_id);

-- Add RLS policies
ALTER TABLE brand_favorites ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own favorites
CREATE POLICY "Users can view their own favorites"
  ON brand_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to add favorites
CREATE POLICY "Users can add favorites"
  ON brand_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = brand_id
      AND p.role = 'brand'
    )
  );

-- Policy for users to remove their own favorites
CREATE POLICY "Users can remove their own favorites"
  ON brand_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON brand_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Policy for shoppers to create their own favorites
CREATE POLICY "Shoppers can create favorites"
  ON brand_favorites FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'shopper'
    )
  );

-- Policy for shoppers to delete their own favorites
CREATE POLICY "Shoppers can delete their own favorites"
  ON brand_favorites FOR DELETE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'shopper'
    )
  );

-- Policy for brands to view who has favorited them
CREATE POLICY "Brands can view their favorites"
  ON brand_favorites FOR SELECT
  USING (
    brand_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'brand'
    )
  );

-- Policy for admins/managers to view all favorites
CREATE POLICY "Admins can view all favorite records"
  ON brand_favorites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  ); 