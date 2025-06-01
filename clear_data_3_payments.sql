-- Chunk 3: Payment and booking-related tables
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
    -- payment_transactions
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_transactions'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM payment_transactions WHERE application_id NOT IN (SELECT id FROM stall_applications WHERE brand_id IN (SELECT id FROM manager_users));
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
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 