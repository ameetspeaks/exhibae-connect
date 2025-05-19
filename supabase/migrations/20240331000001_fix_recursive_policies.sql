-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop all existing policies on profiles
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Create new, non-recursive policies
-- Allow all authenticated users to read profiles
CREATE POLICY "profiles_read_policy" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to insert their own profile only
CREATE POLICY "profiles_insert_policy" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own_policy" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Allow managers to update any profile (using JWT claim instead of recursive check)
CREATE POLICY "profiles_manager_update_policy" 
ON profiles FOR UPDATE 
TO authenticated 
USING (
    auth.jwt()->>'role' = 'manager' OR
    (auth.jwt()->'app_metadata'->>'role')::text = 'manager'
);

-- Allow managers to delete profiles (using JWT claim instead of recursive check)
CREATE POLICY "profiles_manager_delete_policy" 
ON profiles FOR DELETE 
TO authenticated 
USING (
    auth.jwt()->>'role' = 'manager' OR
    (auth.jwt()->'app_metadata'->>'role')::text = 'manager'
);

-- Enable triggers again
SET session_replication_role = DEFAULT; 