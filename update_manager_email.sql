-- Update manager's email address and clean up users
-- Disable triggers temporarily
SET session_replication_role = replica;

-- Start transaction
BEGIN;

-- First, delete the target email user if exists and is not a manager
DO $$ 
DECLARE
    target_user_id uuid;
    is_manager boolean;
BEGIN
    -- Check if target email exists and is not a manager
    SELECT u.id, (p.role = 'manager'::user_role) INTO target_user_id, is_manager
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE u.email = 'ameetspeaks@gmail.com';

    IF target_user_id IS NOT NULL AND NOT is_manager THEN
        RAISE NOTICE 'Deleting existing user with email ameetspeaks@gmail.com';
        DELETE FROM auth.users WHERE id = target_user_id;
    END IF;
END $$;

-- Now handle the manager user update
DO $$ 
DECLARE
    manager_user_id uuid;
    affected_rows integer;
BEGIN
    -- Get the manager user ID
    SELECT u.id INTO manager_user_id
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE p.role = 'manager'::user_role
    AND u.email = 'arjhtechlabs@gmail.com';

    IF manager_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found manager user with ID: %', manager_user_id;
        
        -- Update the manager's email
        UPDATE auth.users 
        SET 
            email = 'ameetspeaks@gmail.com',
            email_confirmed_at = NOW(),
            updated_at = NOW(),
            raw_user_meta_data = jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{email}',
                '"ameetspeaks@gmail.com"'
            ),
            raw_app_meta_data = jsonb_set(
                COALESCE(raw_app_meta_data, '{}'::jsonb),
                '{provider}',
                '"email"'
            )
        WHERE id = manager_user_id
        RETURNING 1 INTO affected_rows;

        RAISE NOTICE 'Updated % rows in auth.users', affected_rows;
    ELSE
        RAISE NOTICE 'No manager user found with email arjhtechlabs@gmail.com';
    END IF;
END $$;

-- Delete all non-manager users
DO $$ 
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM auth.users 
    WHERE id NOT IN (
        SELECT u.id 
        FROM auth.users u
        JOIN profiles p ON u.id = p.id
        WHERE p.role = 'manager'::user_role
    )
    RETURNING 1 INTO deleted_count;

    RAISE NOTICE 'Deleted % non-manager users', deleted_count;
END $$;

-- Update profiles table
UPDATE profiles 
SET email = 'ameetspeaks@gmail.com'
WHERE email = 'arjhtechlabs@gmail.com' 
AND role = 'manager'::user_role;

-- Update any email-related tables
DO $$ 
DECLARE
    table_exists boolean;
    manager_user_id uuid;
BEGIN
    -- Get the manager user ID
    SELECT u.id INTO manager_user_id
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE p.role = 'manager'::user_role;

    -- email_notifications
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_notifications'
    ) INTO table_exists;
    IF table_exists THEN
        UPDATE email_notifications 
        SET data = jsonb_set(
            data,
            '{email}',
            '"ameetspeaks@gmail.com"'
        )
        WHERE data->>'email' = 'arjhtechlabs@gmail.com';
    END IF;

    -- email_logs
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_logs'
    ) INTO table_exists;
    IF table_exists THEN
        UPDATE email_logs 
        SET recipient_email = 'ameetspeaks@gmail.com'
        WHERE recipient_email = 'arjhtechlabs@gmail.com';
    END IF;

    -- email_queue (using user_id reference instead of direct email)
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue'
    ) INTO table_exists;
    IF table_exists THEN
        UPDATE email_queue 
        SET user_id = manager_user_id
        WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = 'arjhtechlabs@gmail.com'
        );
    END IF;
END $$;

-- Verify the update
DO $$
DECLARE
    remaining_old_email integer;
BEGIN
    SELECT COUNT(*) INTO remaining_old_email
    FROM auth.users
    WHERE email = 'arjhtechlabs@gmail.com';

    IF remaining_old_email > 0 THEN
        RAISE NOTICE 'WARNING: Found % users still with old email', remaining_old_email;
    ELSE
        RAISE NOTICE 'Success: No users found with old email';
    END IF;
END $$;

-- Commit transaction
COMMIT;

-- Enable triggers again
SET session_replication_role = DEFAULT; 