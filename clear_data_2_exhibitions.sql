-- Chunk 2: Exhibition and stall-related tables
-- Disable triggers temporarily
SET session_replication_role = replica;

-- Start transaction
BEGIN;

-- Store manager user IDs in a temporary table
CREATE TEMP TABLE manager_users AS
SELECT id FROM profiles WHERE role = 'manager'::user_role;

DO $$ 
DECLARE
    table_exists boolean;
    stall_bookings_exists boolean;
BEGIN
    -- Check if stall_bookings exists first
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_bookings'
    ) INTO stall_bookings_exists;

    -- exhibition_attending
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exhibition_attending'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM exhibition_attending WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- exhibition_favorites
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exhibition_favorites'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM exhibition_favorites WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- exhibition_interests
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exhibition_interests'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM exhibition_interests WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- stall_instances
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_instances'
    ) INTO table_exists;
    IF table_exists THEN
        IF stall_bookings_exists THEN
            -- If stall_bookings exists, use the complex query
            DELETE FROM stall_instances WHERE id IN (
                SELECT stall_instance_id FROM stall_bookings WHERE brand_id NOT IN (SELECT id FROM manager_users)
            );
        ELSE
            -- If stall_bookings doesn't exist, delete all non-manager stall instances
            DELETE FROM stall_instances WHERE id NOT IN (
                SELECT si.id 
                FROM stall_instances si
                JOIN exhibitions e ON si.exhibition_id = e.id
                WHERE e.organiser_id IN (SELECT id FROM manager_users)
            );
        END IF;
    END IF;

    -- maintenance_logs
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'maintenance_logs'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM maintenance_logs WHERE performed_by NOT IN (SELECT id FROM manager_users);
    END IF;

    -- stall_applications
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_applications'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM stall_applications WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 