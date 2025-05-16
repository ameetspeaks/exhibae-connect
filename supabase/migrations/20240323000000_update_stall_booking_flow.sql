-- Add new status for stall instances
ALTER TABLE "public"."stall_instances"
DROP CONSTRAINT IF EXISTS stall_instances_status_check,
ADD CONSTRAINT stall_instances_status_check 
CHECK (status IN ('available', 'pending', 'payment_pending', 'booked', 'under_maintenance'));

-- Add booking deadline for applications
ALTER TABLE "public"."stall_applications"
ADD COLUMN IF NOT EXISTS "booking_deadline" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "booking_confirmed" boolean DEFAULT false;

-- Create function to handle application approval
CREATE OR REPLACE FUNCTION handle_application_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Set booking deadline to 48 hours from now
        NEW.booking_deadline := NOW() + INTERVAL '48 hours';
        
        -- Update stall instance status to payment_pending
        UPDATE "public"."stall_instances"
        SET status = 'payment_pending'
        WHERE id = NEW.stall_instance_id;
        
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        -- If application is rejected, make stall available again
        UPDATE "public"."stall_instances"
        SET status = 'available'
        WHERE id = NEW.stall_instance_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application approval
DROP TRIGGER IF EXISTS handle_application_approval_trigger ON "public"."stall_applications";
CREATE TRIGGER handle_application_approval_trigger
    BEFORE UPDATE OF status
    ON "public"."stall_applications"
    FOR EACH ROW
    EXECUTE FUNCTION handle_application_approval();

-- Modify payment status update function to handle booking confirmation
CREATE OR REPLACE FUNCTION update_application_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total paid amount for the application
    WITH total_paid AS (
        SELECT SUM(amount) as total
        FROM payment_transactions
        WHERE application_id = NEW.application_id
        AND status = 'completed'
    )
    UPDATE stall_applications
    SET 
        payment_amount = COALESCE((SELECT total FROM total_paid), 0),
        payment_status = 
            CASE 
                WHEN COALESCE((SELECT total FROM total_paid), 0) = 0 THEN 'pending'
                WHEN COALESCE((SELECT total FROM total_paid), 0) < (
                    SELECT price FROM stall_instances WHERE id = stall_applications.stall_instance_id
                ) THEN 'partial'
                ELSE 'completed'
            END,
        payment_date = CASE 
            WHEN COALESCE((SELECT total FROM total_paid), 0) >= (
                SELECT price FROM stall_instances WHERE id = stall_applications.stall_instance_id
            ) THEN NOW()
            ELSE NULL
        END,
        -- Set booking_confirmed when payment is completed
        booking_confirmed = CASE 
            WHEN COALESCE((SELECT total FROM total_paid), 0) >= (
                SELECT price FROM stall_instances WHERE id = stall_applications.stall_instance_id
            ) THEN true
            ELSE false
        END
    WHERE id = NEW.application_id
    RETURNING *
    INTO NEW;

    -- If payment is completed, update stall instance status to booked
    IF NEW.booking_confirmed THEN
        UPDATE stall_instances
        SET status = 'booked'
        WHERE id = NEW.stall_instance_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle expired bookings
CREATE OR REPLACE FUNCTION handle_expired_bookings()
RETURNS void AS $$
BEGIN
    -- Find expired unpaid bookings
    UPDATE stall_applications
    SET status = 'rejected'
    WHERE status = 'approved'
    AND booking_deadline < NOW()
    AND NOT booking_confirmed;

    -- Make stalls available again
    UPDATE stall_instances si
    SET status = 'available'
    WHERE status = 'payment_pending'
    AND EXISTS (
        SELECT 1 FROM stall_applications sa
        WHERE sa.stall_instance_id = si.id
        AND sa.status = 'rejected'
        AND sa.booking_deadline < NOW()
        AND NOT sa.booking_confirmed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and handle expired bookings
CREATE OR REPLACE FUNCTION check_expired_bookings()
RETURNS trigger AS $$
BEGIN
    -- Check if there are any expired bookings whenever a stall_applications row is accessed
    PERFORM handle_expired_bookings();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically check for expired bookings
DROP TRIGGER IF EXISTS check_expired_bookings_trigger ON "public"."stall_applications";
CREATE TRIGGER check_expired_bookings_trigger
    AFTER INSERT OR UPDATE
    ON "public"."stall_applications"
    FOR EACH STATEMENT
    EXECUTE FUNCTION check_expired_bookings();

-- Note: If you want to enable cron jobs later, you'll need to:
-- 1. Enable the pg_cron extension in your Supabase project
-- 2. Add the following SQL:
--    SELECT cron.schedule(
--        'handle_expired_bookings',
--        '0 * * * *',
--        $$SELECT handle_expired_bookings();$$
--    ); 