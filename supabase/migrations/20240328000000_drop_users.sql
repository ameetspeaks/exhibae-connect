-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop all data from tables in correct order to handle dependencies
TRUNCATE TABLE 
    stall_applications,
    stall_instances,
    stall_amenities,
    stalls,
    exhibitions,
    notification_preferences,
    profiles
CASCADE;

-- Delete all users from auth.users
DELETE FROM auth.users;

-- Reset all sequences
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS exhibitions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stalls_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stall_applications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stall_instances_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stall_amenities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notification_preferences_id_seq RESTART WITH 1;

-- Enable triggers again
SET session_replication_role = DEFAULT; 