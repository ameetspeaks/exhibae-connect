-- Chunk 5: Activity and statistics tables
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
    -- activity_logs
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM activity_logs WHERE actor_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- brand_activity_log
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_activity_log'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM brand_activity_log WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- brand_statistics
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_statistics'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM brand_statistics WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- email_logs
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_logs'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM email_logs WHERE recipient_email NOT IN (SELECT email FROM profiles WHERE id IN (SELECT id FROM manager_users));
    END IF;

    -- email_queue
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM email_queue WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 