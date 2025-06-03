-- Disable triggers temporarily
SET session_replication_role = replica;

-- Grant necessary permissions for auth schema and auth.users table
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Update measurement_units RLS policies to use profiles table instead of auth.users
DROP POLICY IF EXISTS "measurement_units_insert_policy" ON measurement_units;
DROP POLICY IF EXISTS "measurement_units_update_policy" ON measurement_units;
DROP POLICY IF EXISTS "measurement_units_delete_policy" ON measurement_units;

-- Recreate policies using profiles table
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

-- Enable triggers again
SET session_replication_role = DEFAULT; 