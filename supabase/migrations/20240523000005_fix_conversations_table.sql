-- Drop existing foreign key constraints if they exist
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_brand_id_fkey,
  DROP CONSTRAINT IF EXISTS conversations_organiser_id_fkey;

-- Update the foreign key relationships to use profiles
ALTER TABLE conversations
  ADD CONSTRAINT conversations_brand_id_fkey 
    FOREIGN KEY (brand_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT conversations_organiser_id_fkey 
    FOREIGN KEY (organiser_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;

-- Create new policies with role checks
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    (brand_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'brand'
    )) OR
    (organiser_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'organiser'
    ))
  );

CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    (brand_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'brand'
    )) OR
    (organiser_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'organiser'
    ))
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (
    (brand_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'brand'
    )) OR
    (organiser_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'organiser'
    ))
  ); 