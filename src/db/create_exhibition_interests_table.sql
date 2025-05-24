-- SQL script to create the exhibition_interests table
-- Run this in the Supabase SQL Editor if the table doesn't exist

-- Drop the table if it already exists (comment this out if you don't want to drop existing data)
-- DROP TABLE IF EXISTS exhibition_interests;

-- Create the exhibition_interests table
CREATE TABLE IF NOT EXISTS exhibition_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  
  -- Optional: Add other fields as needed
  -- status TEXT DEFAULT 'pending',
  -- response_message TEXT,
  -- responded_at TIMESTAMPTZ,
  -- responded_by UUID REFERENCES profiles(id),
  
  -- Create a unique constraint to prevent duplicate interests
  UNIQUE(exhibition_id, brand_id)
);

-- Enable Row Level Security
ALTER TABLE exhibition_interests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to control access
-- Allow managers to see all interests
CREATE POLICY "Managers can see all exhibition interests"
  ON exhibition_interests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Allow managers to insert interests
CREATE POLICY "Managers can insert exhibition interests"
  ON exhibition_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Allow brands to see only their own interests
CREATE POLICY "Brands can see their own exhibition interests"
  ON exhibition_interests
  FOR SELECT
  TO authenticated
  USING (
    brand_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'brand'
    )
  );

-- Allow brands to insert their own interests
CREATE POLICY "Brands can insert their own exhibition interests"
  ON exhibition_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'brand'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_exhibition_interests_exhibition_id ON exhibition_interests(exhibition_id);
CREATE INDEX idx_exhibition_interests_brand_id ON exhibition_interests(brand_id);
CREATE INDEX idx_exhibition_interests_created_at ON exhibition_interests(created_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON exhibition_interests TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE exhibition_interests_id_seq TO authenticated;

-- Optional: Add some test data
/*
INSERT INTO exhibition_interests (exhibition_id, brand_id, notes)
VALUES 
  ((SELECT id FROM exhibitions LIMIT 1), 
   (SELECT id FROM profiles WHERE role = 'brand' LIMIT 1),
   'Test interest created from SQL script');
*/ 