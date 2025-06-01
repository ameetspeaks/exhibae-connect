-- Chunk 8: Payment-related tables
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
        DELETE FROM payment_transactions WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- payment_methods
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM payment_methods WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- invoices
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM invoices WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- bank_details
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bank_details'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM bank_details WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- upi_details
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'upi_details'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM upi_details WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;

    -- refunds
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refunds'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM refunds WHERE user_id NOT IN (SELECT id FROM manager_users);
    END IF;
END $$;

-- Drop temporary table
DROP TABLE manager_users;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 