-- Chunk 9: Profile-related tables
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
    -- profiles
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM profiles WHERE id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- brand_profiles
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_profiles'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM brand_profiles WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- organiser_profiles
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organiser_profiles'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM organiser_profiles WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- profile_settings
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profile_settings'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM profile_settings WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- notification_settings
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_settings'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM notification_settings WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- user_preferences
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM user_preferences WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- user_documents
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_documents'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM user_documents WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 