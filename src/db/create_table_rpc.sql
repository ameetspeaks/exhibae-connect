-- RPC function to create the exhibition_interests table
-- Add this in the Supabase SQL Editor under "Functions" section

CREATE OR REPLACE FUNCTION create_exhibition_interests_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- This is important as it will run with the permissions of the creator
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if the table already exists
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'exhibition_interests'
  ) INTO table_exists;

  -- If table already exists, return early
  IF table_exists THEN
    RETURN 'Table exhibition_interests already exists';
  END IF;

  -- Create the table
  EXECUTE '
    CREATE TABLE IF NOT EXISTS exhibition_interests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
      brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      notes TEXT,
      UNIQUE(exhibition_id, brand_id)
    );
    
    -- Enable Row Level Security
    ALTER TABLE exhibition_interests ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Managers can see all exhibition interests"
      ON exhibition_interests
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''manager''
        )
      );
    
    CREATE POLICY "Managers can insert exhibition interests"
      ON exhibition_interests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''manager''
        )
      );
    
    CREATE POLICY "Brands can see their own exhibition interests"
      ON exhibition_interests
      FOR SELECT
      TO authenticated
      USING (
        brand_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''brand''
        )
      );
    
    CREATE POLICY "Brands can insert their own exhibition interests"
      ON exhibition_interests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        brand_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''brand''
        )
      );
    
    -- Create indexes
    CREATE INDEX idx_exhibition_interests_exhibition_id ON exhibition_interests(exhibition_id);
    CREATE INDEX idx_exhibition_interests_brand_id ON exhibition_interests(brand_id);
    CREATE INDEX idx_exhibition_interests_created_at ON exhibition_interests(created_at);
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE ON exhibition_interests TO authenticated;
  ';

  RETURN 'Table exhibition_interests created successfully';
END;
$$; 