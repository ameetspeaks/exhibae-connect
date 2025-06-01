-- Chunk 6: Exhibition-related tables
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
BEGIN
    -- exhibitions
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exhibitions'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM exhibitions WHERE organiser_id NOT IN (SELECT id FROM manager_users);
    END IF;

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

    -- stall_applications
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_applications'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM stall_applications WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- stall_bookings
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_bookings'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM stall_bookings WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- stall_instances
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_instances'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM stall_instances WHERE exhibition_id IN (
            SELECT id FROM exhibitions WHERE organiser_id NOT IN (SELECT id FROM manager_users)
        );
    END IF;
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 