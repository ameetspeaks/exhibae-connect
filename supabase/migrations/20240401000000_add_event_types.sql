-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add event_type_id to exhibitions table
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES event_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_event_type ON exhibitions(event_type_id);

-- Enable RLS on event_types table
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_types
CREATE POLICY "Event types are viewable by everyone"
    ON event_types FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Managers can manage event types"
    ON event_types FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'::user_role
        )
    );

-- Insert default event types
INSERT INTO event_types (name, description)
VALUES
    ('Music Festival', 'Live music performances and entertainment events'),
    ('Cultural Festival', 'Events celebrating cultural heritage and traditions'),
    ('Food Festival', 'Culinary events and food exhibitions'),
    ('Art Exhibition', 'Visual arts and gallery exhibitions'),
    ('Trade Show', 'Business and industry trade exhibitions'),
    ('Tech Conference', 'Technology and innovation conferences'),
    ('Fashion Show', 'Fashion and apparel exhibitions'),
    ('Sports Event', 'Sporting events and competitions'),
    ('Educational Fair', 'Educational and academic exhibitions'),
    ('Religious Festival', 'Religious and spiritual events'),
    ('Film Festival', 'Cinema and film screening events'),
    ('Book Fair', 'Literary events and book exhibitions')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL ON TABLE event_types TO authenticated;
GRANT SELECT ON TABLE event_types TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 