-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop ALL existing policies that depend on the role column
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies for the profiles table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;

    -- Drop all policies for exhibition_categories
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'exhibition_categories' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON exhibition_categories', pol.policyname);
    END LOOP;

    -- Drop all policies for venue_types
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'venue_types' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON venue_types', pol.policyname);
    END LOOP;

    -- Drop all policies for measuring_units
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'measuring_units' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON measuring_units', pol.policyname);
    END LOOP;

    -- Drop all policies for stalls
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stalls' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stalls', pol.policyname);
    END LOOP;

    -- Drop all policies for exhibitions
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'exhibitions' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON exhibitions', pol.policyname);
    END LOOP;

    -- Drop all policies for stall_applications
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stall_applications' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stall_applications', pol.policyname);
    END LOOP;

    -- Drop all policies for stall_instances
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stall_instances' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stall_instances', pol.policyname);
    END LOOP;
END $$;

-- Update the user_role enum type to include manager and remove admin
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('manager', 'organiser', 'brand', 'shopper');

-- First, drop the default constraint
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Convert existing admin users to manager role and update column type
ALTER TABLE profiles 
    ALTER COLUMN role TYPE user_role USING 
    CASE 
        WHEN role::text = 'admin' THEN 'manager'::user_role 
        ELSE role::text::user_role 
    END;

-- Set the new default value with proper casting
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'shopper'::user_role;

-- Drop the old type
DROP TYPE user_role_old;

-- Create policies specific to manager role
CREATE POLICY "Managers can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

CREATE POLICY "Managers can manage all profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Manager policies for categories, venue types, and measuring units
CREATE POLICY "Managers can manage exhibition categories"
    ON exhibition_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

CREATE POLICY "Managers can manage venue types"
    ON venue_types FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

CREATE POLICY "Managers can manage measuring units"
    ON measuring_units FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Recreate stalls policies
CREATE POLICY "Anyone can view published exhibition stalls"
    ON stalls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = stalls.exhibition_id
            AND e.status = 'published'
        )
    );

CREATE POLICY "Organizers can view their exhibition stalls"
    ON stalls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            JOIN profiles p ON p.id = e.organiser_id
            WHERE e.id = stalls.exhibition_id
            AND p.id = auth.uid()
            AND p.role = 'organiser'::user_role
        )
    );

CREATE POLICY "Managers can manage all stalls"
    ON stalls FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'::user_role
        )
    );

-- Enable triggers again
SET session_replication_role = DEFAULT; 