-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies
DROP POLICY IF EXISTS "Venue types are viewable by everyone" ON venue_types;
DROP POLICY IF EXISTS "Managers can manage venue types" ON venue_types;

-- Make sure the table structure is correct
ALTER TABLE venue_types 
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN description DROP NOT NULL,
    ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW()),
    ALTER COLUMN updated_at SET DEFAULT TIMEZONE('utc'::text, NOW());

-- Recreate policies with proper permissions
CREATE POLICY "Venue types are viewable by everyone"
    ON venue_types FOR SELECT
    USING (true);

CREATE POLICY "Managers can insert venue types"
    ON venue_types FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'::user_role
        )
    );

CREATE POLICY "Managers can update venue types"
    ON venue_types FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'::user_role
        )
    );

CREATE POLICY "Managers can delete venue types"
    ON venue_types FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'::user_role
        )
    );

-- Grant proper permissions
GRANT SELECT ON venue_types TO anon;
GRANT ALL ON venue_types TO authenticated;

-- Enable triggers again
SET session_replication_role = DEFAULT; 