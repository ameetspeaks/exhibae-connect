-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop policies for exhibition_categories
    DROP POLICY IF EXISTS "Exhibition categories are viewable by everyone" ON exhibition_categories;
    DROP POLICY IF EXISTS "Managers can manage exhibition categories" ON exhibition_categories;
    
    -- Drop policies for venue_types
    DROP POLICY IF EXISTS "Venue types are viewable by everyone" ON venue_types;
    DROP POLICY IF EXISTS "Managers can manage venue types" ON venue_types;
    
    -- Drop policies for measurement_units
    DROP POLICY IF EXISTS "Measurement units are viewable by everyone" ON measurement_units;
    DROP POLICY IF EXISTS "Managers can manage measurement units" ON measurement_units;
END $$;

-- Create exhibition categories table
CREATE TABLE IF NOT EXISTS exhibition_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create venue types table
CREATE TABLE IF NOT EXISTS venue_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create measurement units table
CREATE TABLE IF NOT EXISTS measurement_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE exhibition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_units ENABLE ROW LEVEL SECURITY;

-- Create policies for exhibition categories
CREATE POLICY "Exhibition categories are viewable by everyone"
    ON exhibition_categories FOR SELECT
    USING (true);

CREATE POLICY "Managers can manage exhibition categories"
    ON exhibition_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Create policies for venue types
CREATE POLICY "Venue types are viewable by everyone"
    ON venue_types FOR SELECT
    USING (true);

CREATE POLICY "Managers can manage venue types"
    ON venue_types FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Create policies for measurement units
CREATE POLICY "Measurement units are viewable by everyone"
    ON measurement_units FOR SELECT
    USING (true);

CREATE POLICY "Managers can manage measurement units"
    ON measurement_units FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Grant permissions
GRANT ALL ON TABLE exhibition_categories TO authenticated;
GRANT ALL ON TABLE exhibition_categories TO service_role;
GRANT SELECT ON TABLE exhibition_categories TO anon;

GRANT ALL ON TABLE venue_types TO authenticated;
GRANT ALL ON TABLE venue_types TO service_role;
GRANT SELECT ON TABLE venue_types TO anon;

GRANT ALL ON TABLE measurement_units TO authenticated;
GRANT ALL ON TABLE measurement_units TO service_role;
GRANT SELECT ON TABLE measurement_units TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 