-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON exhibition_attending;
DROP POLICY IF EXISTS "Users can register attendance" ON exhibition_attending;
DROP POLICY IF EXISTS "Users can delete their own attendance" ON exhibition_attending;
DROP POLICY IF EXISTS "Exhibition organizers can view all attendees" ON exhibition_attending;
DROP POLICY IF EXISTS "Admins can view all attendance records" ON exhibition_attending;

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
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  ); 