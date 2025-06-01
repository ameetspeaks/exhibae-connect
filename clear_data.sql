-- Disable triggers temporarily
SET session_replication_role = replica;

-- Start transaction
BEGIN;

-- Store manager user IDs in a temporary table
CREATE TEMP TABLE manager_users AS
SELECT id FROM profiles WHERE role = 'manager'::user_role;

-- Delete data from tables while preserving manager data
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

    -- conversations
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM conversations WHERE brand_id NOT IN (SELECT id FROM manager_users) AND organiser_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- email_logs
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_logs'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM email_logs WHERE to_email NOT IN (SELECT email FROM profiles WHERE id IN (SELECT id FROM manager_users));
    END IF;

    -- email_queue
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM email_queue WHERE to_email NOT IN (SELECT email FROM profiles WHERE id IN (SELECT id FROM manager_users));
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

    -- maintenance_logs
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'maintenance_logs'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM maintenance_logs WHERE performed_by NOT IN (SELECT id FROM manager_users);
    END IF;

    -- messages
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM messages WHERE sender_id NOT IN (SELECT id FROM manager_users) AND receiver_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- organiser_bank_details
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organiser_bank_details'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM organiser_bank_details WHERE organiser_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- organiser_upi_details
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organiser_upi_details'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM organiser_upi_details WHERE organiser_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- payment_transactions
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_transactions'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM payment_transactions WHERE application_id NOT IN (SELECT id FROM stall_applications WHERE brand_id IN (SELECT id FROM manager_users));
    END IF;

    -- stall_applications
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_applications'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM stall_applications WHERE brand_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- stall_booking_payments
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stall_booking_payments'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM stall_booking_payments WHERE booking_id IN (SELECT id FROM stall_bookings WHERE brand_id NOT IN (SELECT id FROM manager_users));
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
        DELETE FROM stall_instances WHERE id IN (SELECT stall_instance_id FROM stall_bookings WHERE brand_id NOT IN (SELECT id FROM manager_users));
    END IF;

    -- support_agents
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_agents'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM support_agents WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- support_tickets
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM support_tickets WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;
END $$;

-- Delete profiles last (except managers)
DELETE FROM profiles WHERE role != 'manager'::user_role;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 