-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Users can create own interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Organizers can view exhibition interests" ON exhibition_interests;

-- Create new policies using profile IDs and roles
CREATE POLICY "Users can view own interests"
  ON exhibition_interests
  FOR SELECT
  TO authenticated
  USING (
    brand_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'brand'::user_role
    )
  );

CREATE POLICY "Users can create own interests"
  ON exhibition_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'brand'::user_role
    )
  );

CREATE POLICY "Organizers can view exhibition interests"
  ON exhibition_interests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM exhibitions e
      JOIN profiles p ON p.id = e.organiser_id
      WHERE e.id = exhibition_id
      AND p.id = auth.uid()
      AND p.role = 'organiser'::user_role
    )
  ); 