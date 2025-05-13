-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create policy for organizers to insert stalls
CREATE POLICY "Organizers can create stalls for their exhibitions"
    ON stalls FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'::user_role
        )
    );

-- Enable triggers again
SET session_replication_role = DEFAULT; 