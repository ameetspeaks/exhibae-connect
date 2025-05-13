-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- First, drop all existing policies on the profiles table
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_read_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_insert_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_update_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_delete_policy" ON "public"."profiles";

-- Create new, simplified policies
-- Allow all authenticated users to read profiles
CREATE POLICY "profiles_read_policy" ON "public"."profiles"
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile only
CREATE POLICY "profiles_insert_policy" ON "public"."profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy" ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create separate policy for manager updates
CREATE POLICY "profiles_manager_update_policy" ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'manager'
  )
);

-- Allow managers to delete profiles
CREATE POLICY "profiles_delete_policy" ON "public"."profiles"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'manager'
  )
); 