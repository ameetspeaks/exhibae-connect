-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, ensure we're using the correct table name
DO $$ 
BEGIN
    -- Drop the measuring_units table if it exists
    DROP TABLE IF EXISTS public.measuring_units CASCADE;
    
    -- Ensure we have the measurement_units table
    CREATE TABLE IF NOT EXISTS public.measurement_units (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('length', 'area', 'volume', 'weight', 'temperature', 'other')),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.stalls
    DROP CONSTRAINT IF EXISTS stalls_unit_id_fkey;

-- Add the foreign key constraint with the correct reference
ALTER TABLE public.stalls
    ADD CONSTRAINT stalls_unit_id_fkey 
    FOREIGN KEY (unit_id) 
    REFERENCES public.measurement_units(id)
    ON DELETE RESTRICT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_measurement_units_type ON public.measurement_units(type);

-- Enable RLS on measurement_units
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;

-- Create policies for measurement_units
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Measurement units are viewable by everyone" ON public.measurement_units;
    DROP POLICY IF EXISTS "Managers can manage measurement units" ON public.measurement_units;
    
    -- Create new policies
    CREATE POLICY "Measurement units are viewable by everyone"
        ON public.measurement_units FOR SELECT
        USING (true);
        
    CREATE POLICY "Managers can manage measurement units"
        ON public.measurement_units FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = 'manager'::user_role
            )
        );
END $$;

-- Insert default units if they don't exist
INSERT INTO public.measurement_units (name, symbol, type, description)
VALUES 
    ('Meter', 'm', 'length', 'Standard unit of length'),
    ('Centimeter', 'cm', 'length', '1/100 of a meter'),
    ('Square Meter', 'm²', 'area', 'Standard unit of area'),
    ('Square Feet', 'ft²', 'area', 'Imperial unit of area'),
    ('Kilogram', 'kg', 'weight', 'Standard unit of mass'),
    ('Liter', 'L', 'volume', 'Standard unit of volume')
ON CONFLICT (symbol) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON TABLE public.measurement_units TO authenticated;
GRANT SELECT ON TABLE public.measurement_units TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 