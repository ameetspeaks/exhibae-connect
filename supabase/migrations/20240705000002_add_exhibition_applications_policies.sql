-- Enable RLS on exhibition_applications table
ALTER TABLE exhibition_applications ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view approved applications
CREATE POLICY "Anyone can view approved applications"
  ON exhibition_applications
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Policy for brands to view their own applications
CREATE POLICY "Brands can view their own applications"
  ON exhibition_applications
  FOR SELECT
  TO authenticated
  USING (
    brand_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'brand'
    )
  );

-- Policy for organizers to view applications for their exhibitions
CREATE POLICY "Organizers can view applications for their exhibitions"
  ON exhibition_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exhibitions e
      WHERE e.id = exhibition_applications.exhibition_id
      AND e.organiser_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'organiser'
    )
  );

-- Policy for managers to view all applications
CREATE POLICY "Managers can view all applications"
  ON exhibition_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  ); 