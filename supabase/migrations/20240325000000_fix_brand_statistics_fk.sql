-- Drop the existing foreign key constraint
ALTER TABLE IF EXISTS public.brand_statistics
    DROP CONSTRAINT IF EXISTS brand_statistics_brand_id_fkey;

-- Re-create the foreign key constraint with ON DELETE CASCADE
ALTER TABLE IF EXISTS public.brand_statistics
    ADD CONSTRAINT brand_statistics_brand_id_fkey
    FOREIGN KEY (brand_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Grant necessary permissions
GRANT ALL ON public.brand_statistics TO authenticated;
GRANT ALL ON public.brand_statistics TO service_role; 