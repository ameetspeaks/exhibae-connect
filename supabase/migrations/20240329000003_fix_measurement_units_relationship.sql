-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.stalls
    DROP CONSTRAINT IF EXISTS stalls_unit_id_fkey;

-- Add the foreign key constraint with the correct reference
ALTER TABLE public.stalls
    ADD CONSTRAINT stalls_unit_id_fkey 
    FOREIGN KEY (unit_id) 
    REFERENCES public.measurement_units(id)
    ON DELETE RESTRICT;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_measurement_units_type ON public.measurement_units(type);

-- Enable RLS on measurement_units if not already enabled
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;

-- Create policies for measurement_units
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Measurement units are viewable by everyone" ON public.measurement_units;
    
    -- Create new policy
    CREATE POLICY "Measurement units are viewable by everyone"
        ON public.measurement_units FOR SELECT
        USING (true);
END $$;

-- Grant necessary permissions
GRANT ALL ON TABLE public.measurement_units TO authenticated;
GRANT SELECT ON TABLE public.measurement_units TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 