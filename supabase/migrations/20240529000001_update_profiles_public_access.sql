-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies for profiles
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

-- Create new policies

-- Allow public read access to all profiles
CREATE POLICY "profiles_public_read_policy" 
ON profiles FOR SELECT 
TO public 
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

-- Allow managers to update any profile
CREATE POLICY "profiles_manager_update_policy" 
ON profiles FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'manager'
    )
);

-- Allow managers to delete profiles
CREATE POLICY "profiles_manager_delete_policy" 
ON profiles FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'manager'
    )
);

-- Enable triggers again
SET session_replication_role = DEFAULT; 