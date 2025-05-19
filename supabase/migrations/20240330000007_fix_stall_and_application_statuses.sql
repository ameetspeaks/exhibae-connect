-- Disable triggers temporarily
SET session_replication_role = replica;

-- First, update the stall_instances status constraint to include all necessary statuses
ALTER TABLE "public"."stall_instances"
DROP CONSTRAINT IF EXISTS stall_instances_status_check;

-- Update stall_applications table to include payment status
ALTER TABLE "public"."stall_applications"
DROP CONSTRAINT IF EXISTS stall_applications_status_check,
ADD CONSTRAINT stall_applications_status_check 
CHECK (status IN ('pending', 'approved', 'payment_pending', 'rejected', 'booked'));

-- Now add back the stall instances constraint with the correct values
ALTER TABLE "public"."stall_instances"
ADD CONSTRAINT stall_instances_status_check 
CHECK (status IN ('available', 'pending', 'reserved', 'booked', 'under_maintenance'));

-- Create function to handle stall maintenance
CREATE OR REPLACE FUNCTION check_maintenance_allowed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'under_maintenance' AND OLD.status NOT IN ('available') THEN
        RAISE EXCEPTION 'Maintenance status can only be set when stall is available';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for maintenance check
DROP TRIGGER IF EXISTS check_maintenance_trigger ON stall_instances;
CREATE TRIGGER check_maintenance_trigger
    BEFORE UPDATE OF status
    ON stall_instances
    FOR EACH ROW
    EXECUTE FUNCTION check_maintenance_allowed();

-- Update the handle_application_approval function
CREATE OR REPLACE FUNCTION handle_application_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Set booking deadline to 48 hours from now
        NEW.booking_deadline := NOW() + INTERVAL '48 hours';
        NEW.status := 'payment_pending';
        
        -- Update stall instance status to reserved
        IF NEW.stall_instance_id IS NOT NULL THEN
            UPDATE "public"."stall_instances"
            SET status = 'reserved'
            WHERE id = NEW.stall_instance_id
            AND status IN ('available', 'pending'); -- Only update if available or pending
        END IF;
        
    ELSIF NEW.status = 'rejected' AND OLD.status IN ('pending', 'payment_pending') THEN
        -- If application is rejected, make stall available again
        IF NEW.stall_instance_id IS NOT NULL THEN
            UPDATE "public"."stall_instances"
            SET status = 'available'
            WHERE id = NEW.stall_instance_id
            AND status IN ('pending', 'reserved'); -- Only update if pending or reserved
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the payment status update function
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
    UPDATE stall_applications sa
    SET 
        payment_amount = COALESCE((SELECT total FROM total_paid), 0),
        payment_status = 
            CASE 
                WHEN COALESCE((SELECT total FROM total_paid), 0) = 0 THEN 'pending'
                WHEN COALESCE((SELECT total FROM total_paid), 0) < (
                    SELECT price FROM stall_instances WHERE id = sa.stall_instance_id
                ) THEN 'partial'
                ELSE 'completed'
            END,
        payment_date = CASE 
            WHEN COALESCE((SELECT total FROM total_paid), 0) >= (
                SELECT price FROM stall_instances WHERE id = sa.stall_instance_id
            ) THEN NOW()
            ELSE NULL
        END,
        status = CASE 
            WHEN COALESCE((SELECT total FROM total_paid), 0) >= (
                SELECT price FROM stall_instances WHERE id = sa.stall_instance_id
            ) THEN 'booked'
            ELSE status
        END
    WHERE id = NEW.application_id
    RETURNING *
    INTO NEW;

    -- If payment is completed, update stall instance status to booked
    IF NEW.status = 'booked' AND NEW.stall_instance_id IS NOT NULL THEN
        UPDATE stall_instances
        SET status = 'booked'
        WHERE id = NEW.stall_instance_id
        AND status = 'reserved'; -- Only update if currently reserved
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the triggers
DROP TRIGGER IF EXISTS handle_application_approval_trigger ON stall_applications;
CREATE TRIGGER handle_application_approval_trigger
    BEFORE UPDATE OF status
    ON stall_applications
    FOR EACH ROW
    EXECUTE FUNCTION handle_application_approval();

DROP TRIGGER IF EXISTS update_payment_status_trigger ON payment_transactions;
CREATE TRIGGER update_payment_status_trigger
    AFTER INSERT OR UPDATE OF status
    ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_application_payment_status();

-- Update RLS policies for stall_instances to allow organizer operations
CREATE POLICY "organizers_can_manage_stall_instances"
    ON stall_instances FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Enable triggers again
SET session_replication_role = DEFAULT; 