-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Stalls are viewable by everyone" ON stalls;
DROP POLICY IF EXISTS "Organizers can manage stalls for their exhibitions" ON stalls;

-- Enable RLS on stalls table
ALTER TABLE stalls ENABLE ROW LEVEL SECURITY;

-- Create policies for stalls table
CREATE POLICY "Stalls are viewable by everyone"
    ON stalls FOR SELECT
    USING (true);

-- Allow organizers to manage stalls for their exhibitions
CREATE POLICY "Organizers can manage stalls for their exhibitions"
    ON stalls FOR ALL
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

-- Grant necessary permissions
GRANT ALL ON TABLE public.stalls TO authenticated;
GRANT SELECT ON TABLE public.stalls TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 