-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, drop any existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies for stall_instances
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stall_instances' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stall_instances', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS on stall_instances table
ALTER TABLE public.stall_instances ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for stall_instances

-- Allow organizers to view their exhibition's stall instances
CREATE POLICY "Organizers can view their exhibition stall instances"
    ON public.stall_instances FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Allow organizers to insert stall instances for their exhibitions
CREATE POLICY "Organizers can create stall instances"
    ON public.stall_instances FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Allow organizers to update their stall instances
CREATE POLICY "Organizers can update their stall instances"
    ON public.stall_instances FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Allow organizers to delete their stall instances
CREATE POLICY "Organizers can delete their stall instances"
    ON public.stall_instances FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Allow managers to manage all stall instances
CREATE POLICY "Managers can manage all stall instances"
    ON public.stall_instances FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'manager'::user_role
        )
    );

-- Grant necessary permissions
GRANT ALL ON TABLE public.stall_instances TO authenticated;
GRANT SELECT ON TABLE public.stall_instances TO anon;

-- Enable triggers again
SET session_replication_role = DEFAULT; 