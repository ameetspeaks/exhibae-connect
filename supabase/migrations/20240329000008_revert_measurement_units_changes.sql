-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, ensure we're using the correct table name
DO $$ 
BEGIN
    -- Drop the measurement_units table constraints first
    ALTER TABLE IF EXISTS public.exhibitions
        DROP CONSTRAINT IF EXISTS exhibitions_measurement_unit_id_fkey;
    
    ALTER TABLE IF EXISTS public.stalls
        DROP CONSTRAINT IF EXISTS stalls_unit_id_fkey;

    -- Drop indexes
    DROP INDEX IF EXISTS idx_measurement_units_type;
    DROP INDEX IF EXISTS idx_exhibitions_measurement_unit_id;

    -- Drop RLS policies
    DROP POLICY IF EXISTS "measurement_units_select_policy" ON measurement_units;
    DROP POLICY IF EXISTS "measurement_units_insert_policy" ON measurement_units;
    DROP POLICY IF EXISTS "measurement_units_update_policy" ON measurement_units;
    DROP POLICY IF EXISTS "measurement_units_delete_policy" ON measurement_units;

    -- Recreate the original table structure
    ALTER TABLE IF EXISTS public.measurement_units 
        ALTER COLUMN type TYPE text,
        ALTER COLUMN type SET NOT NULL,
        ADD CONSTRAINT measurement_units_type_check 
        CHECK (type IN ('length', 'area', 'volume', 'weight', 'temperature', 'other'));

    -- Recreate the foreign key constraints
    ALTER TABLE public.exhibitions
        ADD CONSTRAINT exhibitions_measurement_unit_id_fkey 
        FOREIGN KEY (measurement_unit_id) 
        REFERENCES public.measurement_units(id)
        ON DELETE RESTRICT;

    ALTER TABLE public.stalls
        ADD CONSTRAINT stalls_unit_id_fkey 
        FOREIGN KEY (unit_id) 
        REFERENCES public.measurement_units(id)
        ON DELETE RESTRICT;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_measurement_units_type ON measurement_units(type);
    CREATE INDEX IF NOT EXISTS idx_exhibitions_measurement_unit_id ON exhibitions(measurement_unit_id);

    -- Recreate RLS policies
    CREATE POLICY "measurement_units_select_policy" 
    ON measurement_units FOR SELECT 
    TO authenticated 
    USING (true);

    CREATE POLICY "measurement_units_insert_policy" 
    ON measurement_units FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

    CREATE POLICY "measurement_units_update_policy" 
    ON measurement_units FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

    CREATE POLICY "measurement_units_delete_policy" 
    ON measurement_units FOR DELETE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );
END $$;

-- Grant necessary permissions
GRANT ALL ON TABLE public.measurement_units TO authenticated;
GRANT SELECT ON TABLE public.measurement_units TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 