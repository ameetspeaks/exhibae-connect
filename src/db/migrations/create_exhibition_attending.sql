-- Create exhibition_attending table
CREATE TABLE IF NOT EXISTS exhibition_attending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_exhibition UNIQUE (user_id, exhibition_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exhibition_attending_user_id ON exhibition_attending(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_attending_exhibition_id ON exhibition_attending(exhibition_id);

-- Add RLS policies
ALTER TABLE exhibition_attending ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own attendance records
CREATE POLICY "Users can view their own attendance"
  ON exhibition_attending FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to create their own attendance records
CREATE POLICY "Users can register attendance"
  ON exhibition_attending FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own attendance records
CREATE POLICY "Users can delete their own attendance"
  ON exhibition_attending FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for exhibition organizers to view all attendees for their exhibitions
CREATE POLICY "Exhibition organizers can view all attendees"
  ON exhibition_attending FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exhibitions e
      WHERE e.id = exhibition_id
      AND e.organiser_id = auth.uid()
    )
  );

-- Policy for admins/managers to view all attendance records
CREATE POLICY "Admins can view all attendance records"
  ON exhibition_attending FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (user_metadata->>'role')::text = 'manager'
    )
  ); 