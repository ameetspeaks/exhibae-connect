-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing policies and triggers
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

-- Drop and recreate the check_expired_bookings_trigger
DROP TRIGGER IF EXISTS check_expired_bookings_trigger ON "public"."stall_applications";

CREATE OR REPLACE FUNCTION check_expired_bookings()
RETURNS trigger AS $$
BEGIN
    -- Only check for expired bookings on status changes to 'approved'
    IF TG_OP = 'UPDATE' AND NEW.status = 'approved' THEN
        PERFORM handle_expired_bookings();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_expired_bookings_trigger
    AFTER UPDATE OF status
    ON "public"."stall_applications"
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION check_expired_bookings();

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

-- Create simplified policies for brands
create policy "brands_can_create_applications"
on "public"."stall_applications"
for insert
to authenticated
with check (
    auth.uid() = brand_id
    and exists (
        select 1 from "public"."stall_instances" si
        where si.id = stall_instance_id
        and si.status = 'available'
    )
);

create policy "brands_can_view_own_applications"
on "public"."stall_applications"
for select
to authenticated
using (
    auth.uid() = brand_id
);

-- Enable triggers again
SET session_replication_role = DEFAULT; 