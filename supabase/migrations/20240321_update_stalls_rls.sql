-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop ALL existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies for the stalls table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stalls' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stalls', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS on stalls table (in case it's not enabled)
ALTER TABLE stalls ENABLE ROW LEVEL SECURITY;

-- Create more specific policies
CREATE POLICY "Anyone can view published exhibition stalls"
    ON stalls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = stalls.exhibition_id
            AND e.status = 'published'
        )
    );

CREATE POLICY "Organizers can view their exhibition stalls"
    ON stalls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = stalls.exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'
        )
    );

CREATE POLICY "Organizers can insert stalls"
    ON stalls FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'
        )
    );

CREATE POLICY "Organizers can update their stalls"
    ON stalls FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = stalls.exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = stalls.exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'
        )
    );

CREATE POLICY "Organizers can delete their stalls"
    ON stalls FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = stalls.exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'
        )
    );

-- Grant necessary permissions
GRANT ALL ON TABLE public.stalls TO authenticated;
GRANT SELECT ON TABLE public.stalls TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 