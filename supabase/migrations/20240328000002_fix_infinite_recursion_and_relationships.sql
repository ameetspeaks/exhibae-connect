-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, drop all existing policies on profiles to prevent recursion
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

-- Create simplified, non-recursive policies for profiles
CREATE POLICY "profiles_select_policy" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "profiles_insert_policy" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR 
    (SELECT COALESCE((auth.jwt() ->> 'role')::text, (auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'manager')
);

CREATE POLICY "profiles_delete_policy" 
ON profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = id OR 
    (SELECT COALESCE((auth.jwt() ->> 'role')::text, (auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'manager')
);

-- Create stall_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."stall_applications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "stall_id" uuid NOT NULL,
    "brand_id" uuid NOT NULL,
    "exhibition_id" uuid NOT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected')),
    "message" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("stall_id") REFERENCES "public"."stalls"("id") ON DELETE CASCADE,
    FOREIGN KEY ("brand_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stall_applications_stall_id ON stall_applications(stall_id);
CREATE INDEX IF NOT EXISTS idx_stall_applications_brand_id ON stall_applications(brand_id);
CREATE INDEX IF NOT EXISTS idx_stall_applications_exhibition_id ON stall_applications(exhibition_id);

-- Enable RLS on stall_applications
ALTER TABLE stall_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on stall_applications
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stall_applications' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stall_applications', pol.policyname);
    END LOOP;
END $$;

-- Create RLS policies for stall_applications
CREATE POLICY "organizers_can_view_applications"
    ON stall_applications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

CREATE POLICY "organizers_can_update_applications"
    ON stall_applications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

CREATE POLICY "brands_can_view_own_applications"
    ON stall_applications FOR SELECT
    TO authenticated
    USING (auth.uid() = brand_id);

CREATE POLICY "brands_can_create_applications"
    ON stall_applications FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = brand_id
        AND EXISTS (
            SELECT 1 FROM stall_instances si
            WHERE si.stall_id = stall_id
            AND si.status = 'available'
        )
    );

-- Add the exhibition relationship
ALTER TABLE stall_applications DROP CONSTRAINT IF EXISTS stall_applications_exhibition_id_fkey;
ALTER TABLE stall_applications ADD CONSTRAINT stall_applications_exhibition_id_fkey 
    FOREIGN KEY (exhibition_id) 
    REFERENCES exhibitions(id) 
    ON DELETE CASCADE;

-- Grant necessary permissions
GRANT ALL ON TABLE public.stall_applications TO authenticated;
GRANT SELECT ON TABLE public.stall_applications TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 