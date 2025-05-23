-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop policies for exhibitions
    DROP POLICY IF EXISTS "Exhibitions are viewable by everyone" ON exhibitions;
    DROP POLICY IF EXISTS "Organisers can create their own exhibitions" ON exhibitions;
    DROP POLICY IF EXISTS "Organisers can update their own exhibitions" ON exhibitions;
    DROP POLICY IF EXISTS "Organisers and managers can delete exhibitions" ON exhibitions;
END $$;

-- Create exhibitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS exhibitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    organiser_id UUID NOT NULL REFERENCES profiles(id),
    venue_type_id UUID NOT NULL REFERENCES venue_types(id),
    category_id UUID NOT NULL REFERENCES exhibition_categories(id),
    measuring_unit_id UUID REFERENCES measurement_units(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived', 'expired')),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exhibitions_organiser ON exhibitions(organiser_id);
CREATE INDEX IF NOT EXISTS idx_exhibitions_status ON exhibitions(status);
CREATE INDEX IF NOT EXISTS idx_exhibitions_dates ON exhibitions(start_date, end_date);

-- Enable RLS
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;

-- Policies for exhibitions
CREATE POLICY "Exhibitions are viewable by everyone"
    ON exhibitions FOR SELECT
    USING (true);

CREATE POLICY "Organisers can create their own exhibitions"
    ON exhibitions FOR INSERT
    WITH CHECK (
        auth.uid() = organiser_id AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'organiser'::user_role
        )
    );

CREATE POLICY "Organisers can update their own exhibitions"
    ON exhibitions FOR UPDATE
    USING (
        auth.uid() = organiser_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

CREATE POLICY "Organisers and managers can delete exhibitions"
    ON exhibitions FOR DELETE
    USING (
        auth.uid() = organiser_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_exhibitions_updated_at ON exhibitions;
CREATE TRIGGER update_exhibitions_updated_at
    BEFORE UPDATE ON exhibitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE exhibitions TO authenticated;
GRANT ALL ON TABLE exhibitions TO service_role;
GRANT SELECT ON TABLE exhibitions TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 