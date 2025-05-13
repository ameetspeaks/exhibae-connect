-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, ensure the measuring_units table exists with the correct name
DO $$ 
BEGIN
    -- Rename measurement_units to measuring_units if it exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'measurement_units') THEN
        ALTER TABLE IF EXISTS public.measurement_units RENAME TO measuring_units;
    END IF;
END $$;

-- Create measuring_units table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.measuring_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('length', 'area', 'volume')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.stalls
    DROP CONSTRAINT IF EXISTS stalls_unit_id_fkey;

-- Add the foreign key constraint with the correct reference
ALTER TABLE public.stalls
    ADD CONSTRAINT stalls_unit_id_fkey 
    FOREIGN KEY (unit_id) 
    REFERENCES public.measuring_units(id)
    ON DELETE RESTRICT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_measuring_units_type ON public.measuring_units(type);

-- Enable RLS on measuring_units
ALTER TABLE public.measuring_units ENABLE ROW LEVEL SECURITY;

-- Create policies for measuring_units
CREATE POLICY "Measuring units are viewable by everyone"
    ON public.measuring_units FOR SELECT
    USING (true);

-- Grant necessary permissions
GRANT ALL ON TABLE public.measuring_units TO authenticated;
GRANT SELECT ON TABLE public.measuring_units TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 