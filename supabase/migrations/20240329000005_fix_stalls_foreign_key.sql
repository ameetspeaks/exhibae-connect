-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, ensure the foreign key is properly set up
DO $$ 
BEGIN
    -- Drop the existing foreign key if it exists
    ALTER TABLE IF EXISTS public.stalls
        DROP CONSTRAINT IF EXISTS stalls_unit_id_fkey;
        
    -- Drop the existing foreign key if it exists (measuring_units version)
    ALTER TABLE IF EXISTS public.stalls
        DROP CONSTRAINT IF EXISTS stalls_measuring_unit_id_fkey;
        
    -- Add the foreign key constraint with the correct reference
    ALTER TABLE public.stalls
        ADD CONSTRAINT stalls_unit_id_fkey 
        FOREIGN KEY (unit_id) 
        REFERENCES public.measurement_units(id)
        ON DELETE RESTRICT;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Enable triggers again
SET session_replication_role = DEFAULT; 