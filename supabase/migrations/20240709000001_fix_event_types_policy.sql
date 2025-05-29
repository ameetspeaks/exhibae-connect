-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policy
DROP POLICY IF EXISTS "Event types are viewable by everyone" ON event_types;

-- Create new policy that includes anonymous users
CREATE POLICY "Event types are viewable by everyone"
    ON event_types FOR SELECT
    USING (true);

-- Enable triggers again
SET session_replication_role = DEFAULT; 