-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create policy for managers to view all exhibitions
CREATE POLICY "Managers can view all exhibitions"
    ON exhibitions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Enable triggers again
SET session_replication_role = DEFAULT; 