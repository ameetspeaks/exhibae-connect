-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organisers can manage stall amenities" ON stall_amenities;
DROP POLICY IF EXISTS "Public can view stall amenities" ON stall_amenities;
DROP POLICY IF EXISTS "Organisers can insert stall amenities" ON stall_amenities;

-- Enable RLS on stall_amenities
ALTER TABLE stall_amenities ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for stall_amenities
CREATE POLICY "Public can view stall amenities"
    ON stall_amenities FOR SELECT
    USING (true);

CREATE POLICY "Organisers can insert stall amenities"
    ON stall_amenities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stalls s
            JOIN exhibitions e ON s.exhibition_id = e.id
            JOIN profiles p ON p.id = e.organiser_id
            WHERE s.id = stall_amenities.stall_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'::user_role
        )
    );

CREATE POLICY "Organisers can update stall amenities"
    ON stall_amenities FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stalls s
            JOIN exhibitions e ON s.exhibition_id = e.id
            JOIN profiles p ON p.id = e.organiser_id
            WHERE s.id = stall_amenities.stall_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'::user_role
        )
    );

CREATE POLICY "Organisers can delete stall amenities"
    ON stall_amenities FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stalls s
            JOIN exhibitions e ON s.exhibition_id = e.id
            JOIN profiles p ON p.id = e.organiser_id
            WHERE s.id = stall_amenities.stall_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'::user_role
        )
    );

-- Grant necessary permissions
GRANT ALL ON TABLE public.stall_amenities TO authenticated;
GRANT SELECT ON TABLE public.stall_amenities TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 