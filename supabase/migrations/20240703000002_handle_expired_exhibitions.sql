-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create function to handle expired exhibitions
CREATE OR REPLACE FUNCTION handle_expired_exhibitions()
RETURNS void AS $$
BEGIN
    -- Update exhibition status to expired for exhibitions that have ended
    UPDATE exhibitions
    SET status = 'expired'
    WHERE end_date < CURRENT_TIMESTAMP
    AND status != 'expired';

    -- Update exhibition_expiry flag for exhibitions that have started
    UPDATE stall_applications
    SET exhibition_expiry = true
    WHERE exhibition_id IN (
        SELECT id 
        FROM exhibitions 
        WHERE start_date <= CURRENT_TIMESTAMP
    )
    AND exhibition_expiry = false;

    -- Cancel all pending applications for exhibitions that have started
    UPDATE stall_applications
    SET status = 'rejected'
    WHERE exhibition_id IN (
        SELECT id 
        FROM exhibitions 
        WHERE start_date <= CURRENT_TIMESTAMP
    )
    AND status IN ('pending', 'payment_pending', 'payment_review')
    AND exhibition_expiry = false;

    -- Make stall instances available again for rejected applications
    UPDATE stall_instances si
    SET status = 'available'
    WHERE EXISTS (
        SELECT 1 
        FROM stall_applications sa
        WHERE sa.stall_instance_id = si.id
        AND sa.status = 'rejected'
        AND sa.exhibition_expiry = true
    )
    AND status IN ('pending', 'reserved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to check expired exhibitions
CREATE OR REPLACE FUNCTION check_expired_exhibitions()
RETURNS trigger AS $$
BEGIN
    PERFORM handle_expired_exhibitions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically check for expired exhibitions
DROP TRIGGER IF EXISTS check_expired_exhibitions_trigger ON exhibitions;
CREATE TRIGGER check_expired_exhibitions_trigger
    AFTER INSERT OR UPDATE OF start_date
    ON exhibitions
    FOR EACH STATEMENT
    EXECUTE FUNCTION check_expired_exhibitions();

-- Create a scheduled job to run daily (if pg_cron extension is available)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'pg_cron'
    ) THEN
        SELECT cron.schedule(
            'check_expired_exhibitions_daily',
            '0 0 * * *', -- Run at midnight every day
            'SELECT handle_expired_exhibitions();'
        );
    END IF;
END $$;

-- Enable triggers again
SET session_replication_role = DEFAULT;

-- Run the function once immediately to handle any existing expired exhibitions
SELECT handle_expired_exhibitions(); 