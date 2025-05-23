-- Create exhibition_favorites table
CREATE TABLE IF NOT EXISTS exhibition_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_exhibition_favorite UNIQUE (user_id, exhibition_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exhibition_favorites_user_id ON exhibition_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_favorites_exhibition_id ON exhibition_favorites(exhibition_id);

-- Add RLS policies
ALTER TABLE exhibition_favorites ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own favorites
CREATE POLICY "Users can view their own favorites"
  ON exhibition_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to create their own favorites
CREATE POLICY "Users can create favorites"
  ON exhibition_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON exhibition_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for exhibition organizers to view all favorites for their exhibitions
CREATE POLICY "Exhibition organizers can view all favorites"
  ON exhibition_favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exhibitions e
      WHERE e.id = exhibition_id
      AND e.organiser_id = auth.uid()
    )
  );

-- Policy for admins/managers to view all favorites
CREATE POLICY "Admins can view all favorite records"
  ON exhibition_favorites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  ); 