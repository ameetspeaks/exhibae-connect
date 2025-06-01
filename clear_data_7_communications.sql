-- Chunk 7: Communication-related tables
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
    -- conversations
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM conversations 
        WHERE brand_id NOT IN (SELECT id FROM manager_users)
        AND organizer_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- messages
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM messages 
        WHERE sender_id NOT IN (SELECT id FROM manager_users)
        AND receiver_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- notifications
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- email_notifications
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_notifications'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM email_notifications WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- support_tickets
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM support_tickets WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- support_messages
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_messages'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM support_messages WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 