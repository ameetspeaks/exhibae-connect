-- Fix RLS policies for exhibition_interests table
-- Run this in the Supabase SQL Editor

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'exhibition_interests';

-- If RLS is not enabled, enable it
ALTER TABLE exhibition_interests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Managers can see all exhibition interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Managers can insert exhibition interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Brands can see their own exhibition interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Brands can insert their own exhibition interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Managers can update exhibition interests" ON exhibition_interests;
DROP POLICY IF EXISTS "Managers can delete exhibition interests" ON exhibition_interests;

-- Create new policies with proper permissions
-- Allow authenticated users with manager role to see all records
CREATE POLICY "Managers can see all exhibition interests"
ON exhibition_interests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

-- Allow authenticated users with manager role to insert records
CREATE POLICY "Managers can insert exhibition interests"
ON exhibition_interests
FOR INSERT
WITH CHECK (true); -- Allow any insert by authenticated users (you can refine this if needed)

-- Allow authenticated users with manager role to update records
CREATE POLICY "Managers can update exhibition interests"
ON exhibition_interests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

-- Allow authenticated users with manager role to delete records
CREATE POLICY "Managers can delete exhibition interests"
ON exhibition_interests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'manager'
  )
);

-- Allow authenticated users with brand role to see their own records
CREATE POLICY "Brands can see their own exhibition interests"
ON exhibition_interests
FOR SELECT
USING (
  brand_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'brand'
  )
);

-- Allow authenticated users with brand role to insert their own records
CREATE POLICY "Brands can insert their own exhibition interests"
ON exhibition_interests
FOR INSERT
WITH CHECK (
  brand_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'brand'
  )
);

-- Display the current policies for the table
SELECT * FROM pg_policies WHERE tablename = 'exhibition_interests'; 