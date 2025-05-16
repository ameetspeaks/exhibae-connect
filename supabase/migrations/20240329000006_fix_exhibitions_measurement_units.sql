-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, ensure we're using the correct column name in exhibitions table
DO $$ 
BEGIN
    -- Rename measuring_unit_id to measurement_unit_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exhibitions' 
        AND column_name = 'measuring_unit_id'
    ) THEN
        ALTER TABLE exhibitions 
        RENAME COLUMN measuring_unit_id TO measurement_unit_id;
    END IF;
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS exhibitions
    DROP CONSTRAINT IF EXISTS exhibitions_measuring_unit_id_fkey;

-- Add the foreign key constraint with the correct reference
ALTER TABLE exhibitions
    ADD CONSTRAINT exhibitions_measurement_unit_id_fkey 
    FOREIGN KEY (measurement_unit_id) 
    REFERENCES public.measurement_units(id)
    ON DELETE RESTRICT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_measurement_unit_id ON exhibitions(measurement_unit_id);

-- Enable triggers again
SET session_replication_role = DEFAULT; 